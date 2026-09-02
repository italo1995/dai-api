// Importamos el paquete socket.io
import { Server as webSocketServer } from 'socket.io'
import ClassAuthService from './services/User/AuthService'
import jwt from 'jsonwebtoken'
import AppConfig from './config/AppConfig'
import { modelUser } from './models'
import { EStatusDriver, type IUserInstance } from './models/User/UserModel'
import ClassTripService from './services/Trip/TripService'
import { EStatusTrip, ETypeService, type ITripInstance } from './models/Trip/TripModel'
import type {
  IParamShowTrip,
  IResponseAllTrip,
  ITripOffertUpdate,
  ITripUpdate,
} from './types/TripType'
import ClassTripOffertService from './services/Trip/TripOffertService'
import { ETripOffertStatus } from './models/Trip/TripOffertModel'
import TripRouteService from './services/Trip/TripRouteService'
import ClassUserService from './services/User/UserService'
import NotificationService from './controller/fcmPushController'
import RangePriceService from './services/Locations/RangePriceService'
import VehicleTypeService from './services/Vehicle/VehicleTypeService'
import ErrorReportingService from './services/ErrorReportingService'
import { withTimeout } from './utils/helpers'
import TripPaymentService from './services/Trip/TripPaymentService'
import { ETypeUser } from './types/User'
import CompanyParameterService from './services/web/CompanyParameterService'
import DriverReportService from './services/User/DriverReportService'
import CurrencyService from './services/Payments/CurrencyService'
// Cada cuanto se vuelve a calcular "viajes cercanos" para un conductor sin viaje activo.
// Evita repetir busquedas pesadas en cada tick de 'coords' (cada pocos segundos) mientras
// el conductor esta quieto/inactivo.
const NEARBY_TRIPS_THROTTLE_MS = 15000

// Creamos una clase SocketService que tendrá los métodos para inicializar y manejar el socket
interface IDataError {
  url: string
  headers: any
  body: any
  userId: string
}
export class SocketService {
  // Declaramos una propiedad estática io que contendrá el objeto io que crearemos
  static io: any
  // Cache en memoria de los socketId de administradores/operadores conectados, para no
  // consultar la base de datos en cada tick de 'coords' solo para saber a quien avisar.
  static adminSocketIds: Set<string> = new Set()
  constructor() {}

  private static registerAdminSocket(pAuth: any, pSocketId: string): void {
    const vRolId = pAuth?.rolId ?? pAuth?.dataValues?.rolId
    if (vRolId === 1 || vRolId === 2) {
      SocketService.adminSocketIds.add(pSocketId)
    }
  }
  // Creamos un método estático initSocket que recibe el servidor http y crea el objeto io
  static initSocket(httpServer: any) {
    // Creamos el objeto io con las opciones de cors
    this.io = new webSocketServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      connectionStateRecovery: {
        // the backup duration of the sessions and the packets
        maxDisconnectionDuration: 2 * 60 * 1000,
        // whether to skip middlewares upon successful recovery
        skipMiddlewares: true,
      },
    })
    // Usamos un middleware para verificar el token del usuario y adjuntarlo al handshake
    this.io.use(async (socket: any, next: any) => {
      if (socket?.handshake?.headers?.authorization) {
        const token = socket.handshake.headers.authorization.split(' ')[1]
        socket.handshake.auth = await this.verifyTokenUser(token)
      }
      // socket.use(([event]: any) => {
      //   socket.event = event // Aquí guardas el nombre del evento
      // })
      next()
    })
    this.io.on('connection', this.handleConnection)
  }

  // Creamos un método estático handleConnection que recibe el socket y maneja los eventos
  static async handleConnection(socket: any) {
    // Obtenemos el usuario del handshake
    let auth = socket?.handshake?.auth || false
    let user: any
    const socketId = socket.id
    // Throttle por conexion para el recalculo de "viajes cercanos" (ver 'coords' mas abajo)
    let vLastNearbySearchAt = 0
    if (socket.id && !auth) {
      auth = await SocketService.verifyTokenUser(false, socket.id)
    }

    if (auth) {
      const user = {
        id: auth?.id,
        socketId: socketId,
      }
      // Actualizamos el socket del usuario en la base de datos
      await ClassAuthService.updateSocket(user)
      SocketService.registerAdminSocket(auth, socketId)
    }

    // Visibilidad basica de conexiones - antes esto no logueaba nada, asi que un socket que
    // conecta sin token valido (auth=false) quedaba completamente invisible en la terminal, sin
    // forma de distinguir "no llego nada" de "llego pero sin auth".
    console.log('socket connected', socketId, auth ? `userId=${auth.id}` : '(sin auth)')

    socket.emit('connection', {
      socketId,
    })

    socket.on('disconnect', async (_reason: any) => {
      console.log('disconnect', socketId)
      SocketService.adminSocketIds.delete(socketId)
      try {
        const vUser = {
          id: auth?.id || user?.id,
          // statusDriver: 0,
          socketId: null,
        }
        console.log('vUser disconnect :>> ', vUser)
        if (vUser?.id) {
          // const vUserDB = await ClassAuthService.show(auth?.id || user.id)
          // if (vUserDB?.dataValues.statusDriver === 1) {
          //   vUser.statusDriver = 0
          // }
          await ClassAuthService.updateSocket(vUser)
        } else {
          await ClassAuthService.updateSocket(vUser)
          await ClassTripService.deletePanic({ socketId: socketId })
        }
      } catch (error) {
        const req: IDataError = {
          body: _reason,
          url: 'disconnect',
          headers: socket.headers,
          userId: auth?.id || user?.id,
        }
        ErrorReportingService.errorCreatedReporting(req, error)
      }
    })

    socket.on('reConnection', async (data: any) => {
      try {
        if (auth) {
          const vUser = {
            id: auth?.id || user?.id || data.userId,
            socketId: socketId,
          }
          console.log('reConnection', vUser)
          if (vUser?.id) {
            await ClassAuthService.updateSocket(vUser)
          }
        } else {
          user = await SocketService.verifyTokenUser(false, socketId)
          if (user) {
            auth = user
            SocketService.registerAdminSocket(auth, socketId)
          }
        }
      } catch (error) {
        const req: IDataError = {
          body: data,
          url: 'reConnection',
          headers: socket.headers,
          userId: auth?.id || user?.id,
        }
        ErrorReportingService.errorCreatedReporting(req, error)
      }
    })

    socket.on('changeState', async (pStateDriver: EStatusDriver) => {
      // Este es el evento que dispara el toggle "disponible" del conductor. No logueaba nada -
      // ni al recibirse ni al terminar - asi que en la terminal (que solo muestra requests HTTP
      // via morgan) esto es invisible aunque llegue y funcione perfecto. Se agrega este log para
      // poder diferenciar "no llego el evento" de "llego pero algo fallo silenciosamente".
      console.log('changeState recibido', { userId: auth?.id || user?.id, pStateDriver, socketId })
      try {
        const vUser = {
          id: auth?.id || user?.id,
          statusDriver: pStateDriver,
          // socketId: socketId
        }
        if (vUser?.id) {
          const vUserDB = await ClassAuthService.updateSocket(vUser)
          console.log('changeState aplicado', { userId: vUser.id, statusDriver: pStateDriver })
          if (Number(vUser.statusDriver) === EStatusDriver.INACTIVE || Number(vUser.statusDriver) === EStatusDriver.BUSSY) {
            const admin = await ClassUserService.allUserAdmin()
            const socketIds: any[] = admin.map((vUser: any) => vUser.socketId)
            if (vUserDB !== null && vUserDB?.dataValues?.id ) {
              const vUserDisconnect = await ClassAuthService.show(vUserDB.dataValues.id)
              SocketService.io.to(socketIds).emit('userDisconnect', vUserDisconnect)
            }
          }
        } else {
          // Llego el evento pero sin usuario identificado (auth/user ambos vacios) - el socket
          // nunca se autentico. Se ignora en silencio (igual que antes), pero ahora al menos
          // queda visible en la terminal en vez de desaparecer sin dejar rastro.
          console.log('changeState ignorado: sin usuario identificado en este socket', { socketId })
        }
      } catch (error) {
        const req: IDataError = {
          body: { data: pStateDriver },
          url: 'changeState',
          headers: socket.headers,
          userId: auth?.id || user?.id,
        }
        ErrorReportingService.errorCreatedReporting(req, error)
      }
    })

    socket.on('coords', async (coords: any) => {
      try {
        const vUser = {
          id: auth?.id || user?.id,
          lat: coords?.lat || null,
          lon: coords?.lng || null,
          socketId: coords?.socketId || socketId,
        }
        if (coords?.isDriver) {
          const socketIds: any[] = [...SocketService.adminSocketIds]
          if (socketIds.length) {
            if (!coords?.userId || !coords?.id && vUser.id) {
              coords.userId = vUser.id
            }
            // Si el coords es del propio conductor conectado, reutilizamos el usuario que ya
            // tenemos en memoria de la conexion en vez de repetir la query pesada de show()
            // (varios joins + un COUNT) en cada tick de ubicacion.
            const vConnectedUser = auth || user
            coords.user =
              coords.userId && coords.userId === vUser.id && vConnectedUser
                ? vConnectedUser
                : await ClassAuthService.show(coords.userId)
            SocketService.io.to(socketIds).emit('coordsDriver', coords)
          }
        }
        if (coords?.tripId) {
          const vParamShowTrip: IParamShowTrip = {
            id: coords.tripId,
            needClient: true,
          }
          const trip = await ClassTripService.showId(vParamShowTrip)
          if (
            auth?.dataValues?.typeUser === ETypeUser.driver ||
            auth?.typeUser === ETypeUser.driver ||
            coords?.isDriver
          ) {
            const clientSocketId = JSON.parse(JSON.stringify(trip))?.user.socketId
            socket.to(clientSocketId).emit('driverPosition', {
              tripId: coords.tripId,
              lat: coords?.lat,
              lon: coords?.lng,
            })
          }
          if (trip?.dataValues.id) {
            const vTripPanics = await ClassTripService.showPanic({ tripId: trip.dataValues.id })
            if (vTripPanics?.length) {
              await ClassAuthService.updateSocket(vUser)
              const socketIds: any[] = vTripPanics.map(
                (vTripPanic) => vTripPanic.dataValues.socketId
              )
              const vRespTripCoords: any = {
                client: null,
                driver: null,
              }
              if (auth?.dataValues.typeUser === ETypeUser.driver || coords?.isDriver) {
                vRespTripCoords.driver = {
                  lat: coords?.lat,
                  lon: coords?.lng,
                }
              } else {
                vRespTripCoords.client = {
                  lat: coords?.lat,
                  lon: coords?.lng,
                }
              }
              socket.to(socketIds).emit(
                'tripCoords',
                vRespTripCoords,
                withTimeout(
                  () => {
                    console.log('¡Éxito!')
                  },
                  () => {
                    console.log('¡Tiempo de espera!')
                  },
                  1000
                )
              )
            }
          }
        } else if (vUser?.lat && vUser?.lon) {
          if (vUser?.id) {
            await ClassAuthService.updateSocket(vUser)
          }
          if (coords?.isDriver) {
            const vNow = Date.now()
            // Mientras el conductor esta inactivo (sin viaje), no hace falta recalcular
            // "viajes cercanos" en cada tick de ubicacion: se refresca a lo sumo cada
            // NEARBY_TRIPS_THROTTLE_MS.
            if (vNow - vLastNearbySearchAt >= NEARBY_TRIPS_THROTTLE_MS) {
              vLastNearbySearchAt = vNow
              const vDriver = auth || user
              const vVehicleType = await VehicleTypeService.show(
                vDriver?.dataValues?.vehicleType || vDriver?.vehicleType
              )
              const vParamToRange = {
                city: coords?.city || null,
                region: coords?.region || null,
                country: coords?.country || null,
                isCar: vVehicleType?.dataValues?.isCar || false,
                isMoto: vVehicleType?.dataValues?.isMoto || false,
                isTravel: false,
                isDelivery: false
              }
              const vRangePrice = await RangePriceService.showPrice(vParamToRange)
              if (vRangePrice?.cityId || vRangePrice?.regionId || vRangePrice?.countryId) {
                const vUserLocationUpdate = {
                  id: vUser.id,
                  cityId: Number(vRangePrice?.cityId) || null,
                  regionId: Number(vRangePrice?.regionId) || null,
                  countryId: Number(vRangePrice?.countryId) || null,
                }
                await ClassUserService.updateLocation(vUserLocationUpdate)
              }
              const vParamTripShow = {
                lat: coords?.lat || null,
                lon: coords?.lng || null,
                distance: vRangePrice?.distanceToSearch || 30,
                isCar: vVehicleType?.dataValues?.isCar || false,
                isMoto: vVehicleType?.dataValues?.isMoto || false,
                userId: vUser?.id
              }
              const vTripOne: IResponseAllTrip | ITripInstance[] =
                await ClassTripService.NearbyTrips(vParamTripShow)
              socket.emit('newTrips', vTripOne)
            }
          }
        }
      } catch (error) {
        const req: IDataError = {
          body: coords,
          url: 'coords',
          headers: socket.headers,
          userId: auth?.id || user?.id,
        }
        ErrorReportingService.errorCreatedReporting(req, error)
      }
    })

    socket.on('acceptTripOffer', async (data: any) => {
      try {
        const vTripOfferId = data.id
        const vTripOffer = await ClassTripOffertService.showDriver(vTripOfferId)
        if (!vTripOffer?.dataValues.driverId) {
          return
        }
        const updateDriver = {
          id: vTripOffer?.dataValues.driverId,
          statusDriver: EStatusDriver.BUSSY,
        }
        const vDriver: IUserInstance | null = await ClassAuthService.updateSocket(updateDriver)
        const vTripId = Number(vTripOffer.dataValues.tripId)
        const vTrip = await ClassTripService.showId({
          id: vTripId,
          userId: auth?.id || user?.id || null,
        })
        if (vTrip?.dataValues.status === EStatusTrip.ACEPTADO) {
          socket.emit('acceptTripOffer', vTrip)
          return
        }
        const vUpdateTrip: ITripUpdate = {
          id: vTripId,
          status: EStatusTrip.ACEPTADO,
          driverId: vTripOffer?.dataValues.driverId,
          userId: vTripOffer?.dataValues.clientId,
          price: Number(vTripOffer.dataValues.amount),
        }
        const vUpdateTripPaymentData = {
          tripId: vTripId,
          amount: Number(vTripOffer.dataValues.amount),
          currencyId: Number(vTripOffer.dataValues.currencyId),
        }
        await TripPaymentService.updatePrice(vUpdateTripPaymentData)
        const vUpdateTripOffert: ITripOffertUpdate = {
          id: vTripOffer.dataValues.id,
          driverId: vTripOffer?.dataValues.driverId,
          status: ETripOffertStatus.ACEPTADA,
        }
        await ClassTripOffertService.update(vUpdateTripOffert)

        const vTripUpdate = await ClassTripService.update(vUpdateTrip)
        const vDriverSocketId = JSON.parse(JSON.stringify(vTripOffer))
        if (vDriver?.dataValues.tokenPush && vTripOffer?.dataValues.clientId) {
          const vClient: IUserInstance | null = await ClassAuthService.show(vTripOffer.dataValues.clientId)
          const text = vTrip?.dataValues.typeService === ETypeService.DELIVERY ? 'te ha seleccionado como repartidor' : 'te ha seleccionado como repartidor'
          const notificationData = {
            title: `${vClient?.dataValues.name} ${text}`,
            body: 'Dirígete al destino. ¡Eso es DAI!',
          }
          await NotificationService.sendNotification(
            [vDriver.dataValues.tokenPush],
            notificationData
          )
        }
        try {
          socket.to(vDriver?.dataValues?.socketId || vDriverSocketId?.driver?.socketId).emit(
            'acceptTripOffer',
            vTripUpdate,
            withTimeout(
              () => {
                console.log('¡Éxito!')
              },
              () => {
                console.log('¡Tiempo de espera!')
              },
              1000
            )
          )
        } catch (error) {
          throw error
        }
        const initRoute = await TripRouteService.showByTripId({
          tripId: vTripId,
        })
        const vParamToRange = {
          cityId: vTrip?.dataValues.cityId || null,
          regionId: vTrip?.dataValues.regionId || null,
          countryId: vTrip?.dataValues.countryId || null,
          isCar: vTrip?.dataValues.typeService === ETypeService.CAR,
          isTravel: vTrip?.dataValues.typeService === ETypeService.TRAVEL,
          isMoto: vTrip?.dataValues.typeService === ETypeService.MOTO,
          isDelivery: vTrip?.dataValues.typeService === ETypeService.DELIVERY
        }
        const vDistance = await RangePriceService.showPriceToId(vParamToRange)
        const vParamNearbyDrivers = {
          lat: initRoute?.dataValues.lat,
          lon: initRoute?.dataValues.lon,
          distance: vDistance?.distanceToSearch || 30,
          typeService: vTrip?.dataValues.typeService,
          minAmount: Number(vTripOffer.dataValues.amount),
          currencyId: vTripOffer.dataValues.currencyId
        }
        if (vParamNearbyDrivers?.lat && vParamNearbyDrivers?.lon) {
          const vNearbyDrivers = await ClassUserService.NearbyDrivers(vParamNearbyDrivers)
          const socketIds: any[] = vNearbyDrivers.map((vUser) => vUser.socketId)
          if (socketIds.length) {
            SocketService.io.to(socketIds).emit('cancelTrip', vTrip)
          }
        }
      } catch (error) {
        const req: IDataError = {
          body: data,
          url: 'acceptTripOffer',
          headers: socket.headers,
          userId: auth?.id || user?.id,
        }
        ErrorReportingService.errorCreatedReporting(req, error)
      }
    })

    socket.on('driverInPlace', async (data: { tripId: number }) => {
      try {
        const vTrip = await ClassTripService.show({
          id: data.tripId,
          userId: auth?.id || user?.id,
        })
        if (vTrip?.dataValues.status === EStatusTrip.ACEPTADO) {
          await ClassTripService.update({
            id: data.tripId,
            status: EStatusTrip.INPLACE,
            driverId: vTrip?.dataValues.driverId || '',
            userId: vTrip?.dataValues.userId || '',
          })
          if (vTrip?.dataValues?.userId) {
            const vClientId: string = vTrip?.dataValues?.userId
            const vClient = await ClassUserService.show({ id: vClientId })
            if (vClient?.dataValues.socketId) {
              await SocketService.io.to(vClient?.dataValues.socketId).emit('driverInPlace', vTrip)
            }
            if (vClient?.dataValues.tokenPush) {
              const notificationData = {
                title: 'Ya llegue',
                body: 'Te estoy esperando',
              }
              await NotificationService.sendNotification(
                [vClient.dataValues.tokenPush],
                notificationData
              )
            }
          }
        }
      } catch (error) {
        const req: IDataError = {
          body: data,
          url: 'driverInPlace',
          headers: socket.headers,
          userId: auth?.id || user?.id,
        }
        ErrorReportingService.errorCreatedReporting(req, error)
      }
    })

    socket.on('driverIsNear', async (data: { tripId: number }) => {
      try {
        const vTrip = await ClassTripService.show({
          id: data.tripId,
          userId: auth?.id || user?.id,
        })
        if (vTrip?.dataValues?.isNear === false) {
          ClassTripService.update({
            id: data.tripId,
            isNear: true
          })
          if (vTrip?.dataValues?.userId) {
            const vClientId: string = vTrip?.dataValues?.userId
            const vClient = await ClassUserService.show({ id: vClientId })
            if (vClient?.dataValues.socketId) {
              await SocketService.io.to(vClient?.dataValues.socketId).emit('driverIsNear', vTrip)
            }
            if (vClient?.dataValues.tokenPush) {
              const notificationData = {
                title: 'Voy llegando',
                body: 'Esperame afuera',
              }
              await NotificationService.sendNotification(
                [vClient.dataValues.tokenPush],
                notificationData
              )
            }
          }
        }
      } catch (error) {
        const req: IDataError = {
          body: data,
          url: 'driverIsNear',
          headers: socket.headers,
          userId: auth?.id || user?.id,
        }
        ErrorReportingService.errorCreatedReporting(req, error)
      }
    })

    socket.on('completedService', async (data: { tripId: number, driverId: string }) => {
      try {
        const vTrip = await ClassTripService.show({
          id: data.tripId,
          userId: auth?.id || user?.id || data?.driverId || false,
        })
        console.log('vTrip?.dataValues.status :>> ', vTrip?.dataValues.status)
        console.log('EStatusTrip.FINALIZADO :>> ', EStatusTrip.FINALIZADO)
        if (vTrip?.dataValues.status !== EStatusTrip.FINALIZADO) {
          // TODO: aca debo sumarle al driver monto
          const vPercentageParameter = await CompanyParameterService.showByName('percentage')
          const vPercentage: number = Number(vPercentageParameter?.dataValues?.value) || 10
          const vTripPrice = Number(vTrip?.dataValues.price)
          const vTripConvert = await CurrencyService.convert({ currencyId: Number(vTrip?.dataValues.currencyId), amount: Number(vTripPrice) })
          const commission: number = (vTripConvert * vPercentage) / 100
          if (vTrip?.dataValues?.driverId) {
            await DriverReportService.updatedOrCreate({
              userId: vTrip?.dataValues.driverId,
              amount: commission,
              quantity: 1,
            })
            const updateDriver = {
              id: vTrip.dataValues.driverId,
              statusDriver: EStatusDriver.ACTIVE,
              discount: commission,
            }
            await ClassAuthService.updateSocket(updateDriver)
          }
          await ClassTripService.update({
            id: data.tripId,
            status: EStatusTrip.FINALIZADO,
            driverId: vTrip?.dataValues.driverId || '',
            userId: vTrip?.dataValues.userId || '',
          })
          if (vTrip?.dataValues?.userId) {
            const vClientId: string = vTrip?.dataValues?.userId
            const vClient = await ClassUserService.show({ id: vClientId })
            if (vClient?.dataValues.socketId) {
              await SocketService.io
                .to(vClient?.dataValues.socketId)
                .emit('completedService', vTrip)
            }
            if (vClient?.dataValues.tokenPush) {
              const notificationData = {
                title: 'Actualizacion de tu viaje',
                body: 'Tu viaje ha finalizado',
              }
              await NotificationService.sendNotification(
                [vClient.dataValues.tokenPush],
                notificationData
              )
            }
          }
        }
      } catch (error) {
        const req: IDataError = {
          body: data,
          url: 'completedService',
          headers: socket.headers,
          userId: auth?.id || user?.id,
        }
        console.log('error :>> ', error)
        ErrorReportingService.errorCreatedReporting(req, error)
      }
    })
    // Aquí puedes definir tus propios eventos, según lo que quieras hacer con tu socket
    // Por ejemplo:
    // socket.on('join', (room: string) => {
    //   // Unir el socket a una sala
    //   socket.join(room)
    //   // Emitir un evento de joined a la sala
    //   this.io.to(room).emit('joined', room)
    // })
    // socket.on('leave', (room: string) => {
    //   // Sacar el socket de una sala
    //   socket.leave(room)
    //   // Emitir un evento de left a la sala
    //   this.io.to(room).emit('left', room)
    // })
  }
  static async verifyTokenUser(token: string | false = false, socketId: string | false = false) {
    try {
      if (token) {
        const decoded = jwt.verify(token, AppConfig.SECRET_KEY) as any
        const user: IUserInstance | null = await modelUser.findByPk(decoded.id)
        if (user) {
          return user
        }
      } else if (socketId) {
        const user: IUserInstance | null = await modelUser.findOne({
          where: {
            socketId: socketId,
          },
        })
        if (user) {
          return user
        }
      }
      return null
    } catch (error) {
      return null
    }
  }
}
