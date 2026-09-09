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
  IParamShowActiveTrip,
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
import ClassVehicleAdditionalService from './services/Vehicle/VehicleAdditionalService'
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

// Si el pasajero que se acaba de conectar tiene un viaje activo todavia PENDIENTE (buscando
// conductor), reenvia cualquier oferta que siga en espera - cubre el caso de perder señal justo
// cuando un conductor oferta: el evento 'newTripOffer' en vivo se pierde (io.to a un socket
// muerto no llega a nadie), y sin esto el pasajero nunca se enteraba de esa oferta hasta que el
// conductor la cancelara o expirara. Reconstruye el mismo shape que arma
// TripOffertController.create() al ofertar por primera vez, asi el manejador de 'newTripOffer'
// que ya tiene la app no necesita ningun cambio. "Mejor esfuerzo": si algo falla aca no debe
// tumbar la conexion.
async function resyncMissedOffersOnConnect(pSocket: any, pAuth: any): Promise<void> {
  try {
    if (pAuth?.typeUser !== ETypeUser.passenger) {
      return
    }
    const vParam: IParamShowActiveTrip = { isClient: true, userId: pAuth.id }
    const vTrip = await ClassTripService.showActive(vParam)
    if (!vTrip || vTrip.dataValues.status !== EStatusTrip.PENDIENTE) {
      return
    }
    const vPendingOffers = await ClassTripOffertService.showAllPendingByTrip(vTrip.dataValues.id)
    for (const vOffer of vPendingOffers) {
      const vDriverId = vOffer.dataValues.driverId
      const vDriver = await ClassUserService.show({ id: vDriverId, isDriver: true })
      const vVehicleAdditionalService = await ClassVehicleAdditionalService.allFilterIdArray(vDriver)
      const vFullOffer = await ClassTripOffertService.show(Number(vOffer.dataValues.id))
      pSocket.emit('newTripOffer', {
        offer: vFullOffer,
        driver: vDriver,
        countTrips: await ClassTripService.countTrip(vDriverId),
        duration: vOffer.dataValues.duration,
        distance: vOffer.dataValues.distance,
        vehicleAdditionalService: vVehicleAdditionalService,
      })
    }
    if (vPendingOffers.length) {
      console.log('resyncMissedOffersOnConnect: se reenviaron ofertas pendientes al reconectar', {
        userId: pAuth.id,
        tripId: vTrip.dataValues.id,
        count: vPendingOffers.length,
      })
    }
  } catch (error) {
    console.log('resyncMissedOffersOnConnect error', error)
  }
}

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
      // Defaults de engine.io: pingInterval 25000 + pingTimeout 20000 = 45s para notar una
      // conexion muerta en silencio (sin evento de transporte, ej. red movil que cambia de
      // celda). Se bajan a 10s/5s = 15s de ventana - a costa de algo mas de trafico de
      // heartbeat y de ser un poco mas sensible a demoras de red pasajeras (analisis de
      // Ricardo, 2026-09-08).
      pingInterval: 10000,
      pingTimeout: 5000,
      connectionStateRecovery: {
        // the backup duration of the sessions and the packets
        maxDisconnectionDuration: 2 * 60 * 1000,
        // whether to skip middlewares upon successful recovery
        skipMiddlewares: true,
      },
    })
    // Usamos un middleware para verificar el token del usuario y adjuntarlo al handshake.
    // Acepta el token por header Authorization (como lo manda hoy la app - extraHeaders) O por
    // socket.handshake.auth.token (la opcion 'auth' nativa de socket.io-client) - por si algun
    // cliente (o una version futura de la app) lo manda de esa forma en vez de header. Si
    // vienen los dos, el header gana. Cualquiera sea el caso, socket.handshake.auth termina
    // siempre en el usuario ya resuelto o en 'false' - nunca se deja el objeto crudo del
    // cliente sin verificar.
    this.io.use(async (socket: any, next: any) => {
      const vHeaderToken = socket?.handshake?.headers?.authorization?.split(' ')[1]
      const vAuthOptionToken = socket?.handshake?.auth?.token
      const vToken = vHeaderToken || vAuthOptionToken
      socket.handshake.auth = vToken ? await this.verifyTokenUser(vToken) : false
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
      // No se espera (no bloquea la conexion) - es un "mejor esfuerzo" de recuperar ofertas
      // que se pudieron haber perdido mientras el pasajero estaba sin señal.
      resyncMissedOffersOnConnect(socket, auth)
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
        const vUserId = auth?.id || user?.id
        if (vUserId) {
          // Compare-and-swap: solo limpia si el socketId en la DB sigue siendo este mismo -
          // si el usuario ya reconecto con un socket nuevo antes de que este disconnect
          // tardio llegara, no lo toca (ver analisis de Ricardo, 2026-09-08).
          await ClassAuthService.clearSocketIfCurrent(vUserId, socketId)
        } else {
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
          // Siempre el socketId real de ESTA conexion, nunca el que mande el cliente - el
          // cliente puede traer en el payload un id viejo/muerto (ej. un emit bufferado desde
          // antes de reconectar) y terminaria pisando el socketId correcto que ya quedo
          // guardado al conectar.
          socketId: socketId,
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
            if (coords.userId && coords.userId === vUser.id && vConnectedUser) {
              coords.user = vConnectedUser
              SocketService.io.to(socketIds).emit('coordsDriver', coords)
            } else if (coords.userId) {
              coords.user = await ClassAuthService.show(coords.userId)
              SocketService.io.to(socketIds).emit('coordsDriver', coords)
            }
            // Si coords.userId sigue vacio aca (socket sin auth resuelta Y el cliente tampoco
            // mando userId/id) antes esto llamaba ClassAuthService.show(undefined), que Sequelize
            // rechaza duro con "WHERE parameter \"id\" has invalid \"undefined\" value" - eran
            // 225 de los 387 errores guardados en error_reportings, siempre con este mismo
            // patron (coords de un conductor sin usuario identificado en el socket). Se deja de
            // emitir 'coordsDriver' en ese caso en vez de crashear - no hay un usuario real que
            // mostrarle al admin de todas formas. La causa raiz probable (por que el socket no
            // esta identificado) sigue sin confirmar - ver el log 'socket connected ... (sin
            // auth)' agregado hoy mismo en la conexion.
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
        // No permitir completar un viaje ya cancelado/anulado - antes solo se excluia
        // FINALIZADO, asi que un conductor que no se entero de la cancelacion (ver fix en
        // TripController.update, cancelTripActive) podia completarlo igual y quedaba
        // registrado como exitoso con calificacion mutua (QA-01).
        if (
          vTrip?.dataValues.status !== EStatusTrip.FINALIZADO &&
          vTrip?.dataValues.status !== EStatusTrip.CANCELADO &&
          vTrip?.dataValues.status !== EStatusTrip.ANULADO
        ) {
          // TODO: aca debo sumarle al driver monto
          const vPercentageParameter = await CompanyParameterService.showByName('percentage')
          const vPercentage: number = Number(vPercentageParameter?.dataValues?.value) || 10
          const vTripPrice = Number(vTrip?.dataValues.price)
          const vTripConvert = await CurrencyService.convertToPrincipal({ currencyId: Number(vTrip?.dataValues.currencyId), amount: Number(vTripPrice) })
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
        // QA-03: mismo chequeo de sesion unica que en server.ts/verifyTokenUser (HTTP) - un
        // token de una sesion desplazada por un login mas nuevo en otro dispositivo se rechaza
        // aca tambien, para que ni el socket conecte con el.
        if (
          user &&
          user.dataValues.activeSessionId &&
          decoded.sessionId !== user.dataValues.activeSessionId
        ) {
          return null
        }
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
