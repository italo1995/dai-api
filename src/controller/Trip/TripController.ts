/* 
- File: TripController.ts

- Purpose: Es el controlador de auth de trip se encarga de los viajes
- Author: Jairo Belen

- Creation: 31/01/2024  

==========Functions Manifest==========

- Paya Methods:
Para todo los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- show: Sirve un dato especifico filtrado por el id

2 - all: Sirve todos los datos guardados o paginado

3 - update: Cumple la funcion de recibir todos los datos que se pueden actualizarluego los envia a guardar en el servicio

4 - create: Esto es en caso de que en un futuro necesitos crear nuevos pero lo mas probable nunca se use

 */
import type { NextFunction, Request, Response } from 'express'
import type { UUID } from 'crypto'
import ClassTripService from '../../services/Trip/TripService'
import ClassTripRouteService from '../../services/Trip/TripRouteService'
import ClassTripDeliveryService from '../../services/Trip/TripDeliveryService'
import ClassTripTravelService from '../../services/Trip/TripTravelService'
import ClassUserService from '../../services/User/UserService'
import type {
  ITripInput,
  IResponseAllTrip,
  IParamAllTrip,
  IParamShowTrip,
  ITripRouteInput,
  ITripTravelInput,
  ITripDeliveryInput,
  IParamShowActiveTrip,
  ITripUpdate,
  ITripCancellationOptionInput,
} from '../../types/TripType'
import {
  fxSuccessResponse,
  fxErrorResponse,
  moveImages,
  sortLatLonDriver,
} from '../../utils/helpers'
import { EStatusTrip, ETypeService, type ITripInstance } from '../../models/Trip/TripModel'
import ClassTripPaymentService from '../../services/Trip/TripPaymentService'
import NotificationService from '../fcmPushController'
import { SocketService } from '../../ws'
import TripOffertService from '../../services/Trip/TripOffertService'
import VehicleAdditionalService from '../../services/Vehicle/VehicleAdditionalService'
import { ETypeUser } from '../../types/User'
import ClassTripCancellationOptionService from '../../services/Trip/TripCancellationOptionService'
import ClassAuthService from '../../services/User/AuthService'
import { EStatusDriver } from '../../models/User/UserModel'
import RangePriceService from '../../services/Locations/RangePriceService'
class TripController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: IParamShowTrip = {
        userId: pReq.auth.id,
        isClient: pReq.input('isClient', 'json'),
        isDriver: pReq.input('isDriver', 'json'),
        id: pReq.input('id', 'number'),
        isAdmin: (pReq.auth.rolId === 2 || pReq.auth.rolId === 1)
      }
      console.log('vParam :>> ', vParam)
      if (vParam.id === undefined) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'El id es requerido'))
      }
      if (vParam.isClient === undefined && vParam.isDriver === undefined && !vParam.isAdmin) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Se requiere isClient o isDriver'))
      }
      const vResponse: ITripInstance | null = await ClassTripService.show(vParam)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: vResponse }, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async showTripActive(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: IParamShowActiveTrip = {
        userId: pReq.auth.id,
        id: pReq.input('id', 'number'),
      }
      if (pReq.auth.typeUser === ETypeUser.driver) {
        delete vParam.userId
        vParam.driverId = pReq.auth.id
        vParam.isClient = false
      }
      const vResponse: ITripInstance | null = await ClassTripService.showActive(vParam)
      if (!vResponse) {
        return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto', false))
      }
      if (
        vResponse.dataValues.status === EStatusTrip.ACEPTADO ||
        vResponse.dataValues.status === EStatusTrip.INPLACE
      ) {
        const vTripOffer = await TripOffertService.showAcept(vResponse?.dataValues.id)
        const vDriverParam = {
          id: vTripOffer?.dataValues.driverId || '',
          isDriver: true,
        }
        const vDriverSocketId = await ClassUserService.show(vDriverParam)
        const vClient = await ClassUserService.show({
          id: vTripOffer?.dataValues.clientId || '',
          isDriver: false,
        })
        const vVehicleAdditionalService =
          await VehicleAdditionalService.allFilterIdArray(vDriverSocketId)
        const tripOffertId = Number(vTripOffer?.dataValues.id)
        const getTimeRemaining = await TripOffertService.getTimeRemaining(tripOffertId)
        const vDataNewTripOffert = {
          offer: vTripOffer,
          driver: vDriverSocketId,
          countTrips: vTripOffer?.dataValues.driverId
            ? await ClassTripService.countTrip(vTripOffer.dataValues.driverId)
            : 0,
          duration: vTripOffer?.dataValues.duration,
          distance: vTripOffer?.dataValues.distance,
          vehicleAdditionalService: vVehicleAdditionalService,
          client: vClient,
          getTimeRemaining,
        }
        const vReponseJSON = JSON.parse(JSON.stringify(vResponse))
        vReponseJSON.dataDriver = vDataNewTripOffert
        return pRes.status(200).send(fxSuccessResponse(200, vReponseJSON, 'Correcto'))
      } else {
        return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
      }
    } catch (error) {
      pNext(error)
    }
  }

  async showActive(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: IParamShowActiveTrip = {
        userId: pReq.auth.id,
        isClient: pReq.input('isClient', 'json'),
        isDriver: pReq.input('isDriver', 'json'),
      }
      if (pReq.auth.typeUser === ETypeUser.driver) {
        vParam.isClient = false
        vParam.isDriver = true
      }
      if (vParam.isClient === undefined && vParam.isDriver === undefined) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Se requiere isClient o isClient'))
      }
      const vResponse: ITripInstance | null = await ClassTripService.showActive(vParam)
      if (!vResponse) {
        return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto', false))
      }
      if (
        vResponse.dataValues.status === EStatusTrip.ACEPTADO ||
        vResponse.dataValues.status === EStatusTrip.INPLACE
      ) {
        const vTripOffer = await TripOffertService.showAcept(vResponse?.dataValues.id)
        const vDriverParam = {
          id: vTripOffer?.dataValues.driverId || '',
          isDriver: true,
        }
        const vDriverSocketId = await ClassUserService.show(vDriverParam)
        const vVehicleAdditionalService =
          await VehicleAdditionalService.allFilterIdArray(vDriverSocketId)
        const vDataNewTripOffert = {
          offer: vTripOffer,
          driver: vDriverSocketId,
          countTrips: vTripOffer?.dataValues.driverId
            ? await ClassTripService.countTrip(vTripOffer.dataValues.driverId)
            : 0,
          duration: vTripOffer?.dataValues.duration,
          distance: vTripOffer?.dataValues.distance,
          vehicleAdditionalService: vVehicleAdditionalService,
        }
        const vReponseJSON = JSON.parse(JSON.stringify(vResponse))
        vReponseJSON.dataDriver = vDataNewTripOffert
        return pRes.status(200).send(fxSuccessResponse(200, vReponseJSON, 'Correcto'))
      } else {
        const vInitRoute = await ClassTripRouteService.showByTripId({
          tripId: vResponse?.dataValues.id,
        })
        const vParamToRange = {
          cityId: vResponse?.dataValues.cityId || null,
          regionId: vResponse?.dataValues.regionId || null,
          countryId: vResponse?.dataValues.countryId || null,
          // isCar:
          //   vResponse?.dataValues.typeService === ETypeService.CAR ||
          //   vResponse?.dataValues.typeService === ETypeService.TRAVEL,
          // isMoto:
          //   vResponse?.dataValues.typeService === ETypeService.MOTO ||
          //   vResponse?.dataValues.typeService === ETypeService.DELIVERY,
          isCar: vResponse?.dataValues.typeService === ETypeService.CAR,
          isMoto: vResponse?.dataValues.typeService === ETypeService.MOTO,
          isDelivery: vResponse?.dataValues.typeService === ETypeService.DELIVERY,
          isTravel: vResponse?.dataValues.typeService === ETypeService.TRAVEL,
        }
        const vDistance = await RangePriceService.showPriceToId(vParamToRange)
        const vParamNearbyDrivers = {
          lat: vInitRoute?.dataValues.lat,
          lon: vInitRoute?.dataValues.lon,
          distance: vDistance?.distanceToSearch || 30,
          typeService: vResponse?.dataValues.typeService,
          minAmount: Number(vResponse?.dataValues?.price),
          currencyId: vResponse.dataValues.currencyId
        }
        const vNearbyDrivers = await ClassUserService.NearbyDrivers(vParamNearbyDrivers)
        const vResponseTripActive = JSON.parse(JSON.stringify(vResponse))
        if (vNearbyDrivers.length < 10) {
          const vNearbyDriversJSON: any[] = JSON.parse(JSON.stringify(vNearbyDrivers))
          const existingCoords: any = vNearbyDriversJSON.map((driver) => [driver.lat, driver.lon])
          const duplicatedCoords: any = existingCoords.map(([lat, lon]: [number, number]) =>
            sortLatLonDriver(lat, lon)
          )
          const newDrivers = duplicatedCoords.map(([newLat, newLon]: [number, number]) => ({
            id: '123',
            lat: newLat,
            lon: newLon,
          }))
          const updatedDrivers = [...vNearbyDriversJSON, ...newDrivers]
          vResponseTripActive.nearbyDrivers = updatedDrivers
        } else {
          vResponseTripActive.nearbyDrivers = vNearbyDrivers
        }
        return pRes.status(200).send(fxSuccessResponse(200, vResponseTripActive, 'Correcto'))
      }
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: IParamAllTrip = {
        userId: pReq.auth.id,
        isClient: pReq.input('isClient', 'json'),
        isDriver: pReq.input('isDriver', 'json'),
        search: pReq.query?.search?.toString() || null,
        typeSearch: pReq.query?.typeSearch?.toString() || null,
        pag: pReq.query?.pag ? Number(pReq.query?.pag) : null,
        limit: pReq.query?.limit ? Number(pReq.query?.limit) : null,
        recient: pReq.input('recient', 'json'),
        initDate: pReq.input('initDate'),
        endDate: pReq.input('endDate'),
        again: pReq.input('again'),
      }
      if (vParam.isClient === undefined && vParam.isDriver === undefined) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Se requiere isClient o isClient'))
      }
      const vResponse: IResponseAllTrip | ITripInstance[] = await ClassTripService.all(vParam)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async allAdmin(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: IParamAllTrip = {
        userId: pReq.input('userId', 'string'),
        clientId: pReq.input('clientId', 'string'),
        driverId: pReq.input('driverId', 'string'),
        isClient: pReq.input('isClient', 'json') || true,
        isDriver: pReq.input('isDriver', 'json') || true,
        search: pReq.query?.search?.toString() || null,
        typeSearch: pReq.query?.typeSearch?.toString() || null,
        pag: pReq.query?.pag ? Number(pReq.query?.pag) : null,
        limit: pReq.query?.limit ? Number(pReq.query?.limit) : null,
        recient: pReq.input('recient', 'json'),
        initDate: pReq.input('initDate'),
        endDate: pReq.input('endDate'),
        again: true,
        status: pReq.input('status', 'string'),
        typeService: pReq.input('typeService', 'string'),
        driverName: pReq.input('driverName', 'string'),
      }
      if (vParam.isClient === undefined && vParam.isDriver === undefined) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Se requiere isClient o isClient'))
      }
      const vResponse: IResponseAllTrip | ITripInstance[] = await ClassTripService.all(vParam)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: null }, 'Ocurrio un error'))
      }
      const vResponseJSON = JSON.parse(JSON.stringify(vResponse))
      if ('data' in vResponseJSON) {
        for (const item of vResponseJSON.data) {
          const vTripOffer = await TripOffertService.showAcept(item.id)
          if (vTripOffer) {
            item.duration = vTripOffer.dataValues.duration
          }
        }
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponseJSON, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vUserId = pReq.auth.id
      const vData: ITripInput = pReq.only([
        'typeService',
        'userId',
        'driverId',
        'date',
        'status',
        'price',
        'currencyId',
        'instructionsToDriver',
        'serviceDistance'
      ])
      const vParamToRange = {
        city: pReq.input('city'),
        region: pReq.input('region'),
        country: pReq.input('country'),
        // isCar: vData.typeService === ETypeService.CAR || vData.typeService === ETypeService.TRAVEL,
        // isMoto:
        //   vData.typeService === ETypeService.MOTO || vData.typeService === ETypeService.DELIVERY,
        isCar: vData.typeService === ETypeService.CAR,
        isMoto: vData.typeService === ETypeService.MOTO,
        isDelivery: vData.typeService === ETypeService.DELIVERY,
        isTravel: vData.typeService === ETypeService.TRAVEL,
      }
      const vRangePrice = await RangePriceService.showPrice(vParamToRange)
      if (vRangePrice) {
        vData.cityId = vRangePrice?.cityId || null
        vData.countryId = vRangePrice?.countryId || null
        vData.regionId = vRangePrice?.regionId || null
      }
      vData.status = EStatusTrip.PENDIENTE
      const vFee = pReq.input('fee', 'json')
      vData.price = vData?.price || vFee?.price
      vData.currencyId = vData?.currencyId || vFee?.currencyId
      vData.userId = vUserId
      const vInitRoute = pReq.input('initRoute', 'json')
      const vEndRoute = pReq.input('endRoute', 'json')
      const vTripPayment = pReq.input('paymentMethod', 'json')
      const vtripSpecialRequest = pReq.input('tripSpecialRequest', 'json')
      const vTripDelivery: ITripDeliveryInput = pReq.input('delivery', 'json')
      const vTripTravel: ITripTravelInput = pReq.input('travel', 'json')
      if (vInitRoute === undefined || vEndRoute === undefined) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Se requieren las rutas'))
      }
      const vTripReponse: ITripInstance | null = await ClassTripService.create(vData)
      if (!vTripReponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (vTripPayment) {
        vTripPayment.tripId = vTripReponse.dataValues.id
        await ClassTripPaymentService.create(vTripPayment)
      }
      if (vTripDelivery) {
        vTripDelivery.tripId = Number(vTripReponse.dataValues.id)
        await ClassTripDeliveryService.create(vTripDelivery)
      }
      if (vtripSpecialRequest) {
        vtripSpecialRequest.map((sp: any) => (sp.tripId = vTripReponse.dataValues.id))
        await ClassTripService.createSpecialRequest(vtripSpecialRequest)
      }
      if (vTripTravel) {
        vTripTravel.tripId = vTripReponse.dataValues.id
        await ClassTripTravelService.create(vTripTravel)
      }
      if (vInitRoute && vEndRoute) {
        const vCreateRoutes: ITripRouteInput[] = []
        const vCreateInitRoute: ITripRouteInput = {
          ...vInitRoute,
          tripId: vTripReponse.dataValues.id,
        }
        if (vCreateInitRoute?.referencePointImage) {
          vCreateInitRoute.referencePointImage = await moveImages(
            vCreateInitRoute.referencePointImage
          )
        }
        vCreateRoutes.push(vCreateInitRoute)
        delete vEndRoute.isInit
        const vCreateEndRoute: ITripRouteInput = {
          ...vEndRoute,
          isInit: false,
          tripId: vTripReponse.dataValues.id,
        }
        vCreateRoutes.push(vCreateEndRoute)
        await ClassTripRouteService.createMany(vCreateRoutes)
      }
      const vParamNearbyDrivers = {
        lat: vInitRoute.lat,
        lon: vInitRoute.lon,
        distance: vRangePrice?.distanceToSearch || 30,
        typeService: vData.typeService,
        minAmount: Number(vData?.price),
        currencyId: vData.currencyId
      }
      const vNearbyDrivers = await ClassUserService.NearbyDrivers(vParamNearbyDrivers)
      const socketIds: any[] = vNearbyDrivers.map((vUser) => vUser.socketId)
      const tokenPushs: any[] = vNearbyDrivers.map((vUser) => vUser.dataValues.tokenPush)
      const vParamTripShow = {
        id: Number(vTripReponse.id),
        userId: vTripReponse.userId,
        isClient: true,
      }
      const vTripOne: ITripInstance | null = await ClassTripService.show(vParamTripShow)
      if (vTripOne) {
        // const ClassSendNotification = new NotificationService()
        const notificationData = {
          title: 'Nuevo viaje',
          body: 'Un nuevo viaje cerca de ti',
          data: JSON.stringify(vTripOne),
        }
        if (tokenPushs.length) {
          await NotificationService.sendNotification(tokenPushs, notificationData)
        }
      }
      if (socketIds.length) {
        SocketService.io.to(socketIds).emit('newTrip', vTripOne)
      }
      if (vNearbyDrivers.length < 10) {
        const vNearbyDriversJSON: any[] = JSON.parse(JSON.stringify(vNearbyDrivers))
        const existingCoords: any = vNearbyDriversJSON.map((driver) => [driver.lat, driver.lon])
        const duplicatedCoords: any = existingCoords.map(([lat, lon]: [number, number]) =>
          sortLatLonDriver(lat, lon)
        )
        const newDrivers = duplicatedCoords.map(([newLat, newLon]: [number, number]) => ({
          id: '123',
          lat: newLat,
          lon: newLon,
        }))
        const updatedDrivers = [...vNearbyDriversJSON, ...newDrivers]
        const vResponse = {
          trip: vTripReponse,
          nearbyDrivers: updatedDrivers,
        }
        return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
      }
      const vResponse = {
        trip: vTripReponse,
        nearbyDrivers: vNearbyDrivers,
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      console.log('error :>> ', error)
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vUserId: string = pReq.auth.id
      const vData: ITripUpdate = pReq.only([
        'id',
        'userId',
        'driverId',
        'date',
        'status',
        'price',
        'currencyId',
        'instructionsToDriver',
      ])
      const vIsClient = pReq.input('isClient')
      const vIsDriver = pReq.input('isDriver')
      if (vIsClient || pReq.auth.typeUser === ETypeUser.passenger) {
        vData.userId = vUserId
      } else if (vIsDriver || pReq.auth.typeUser === ETypeUser.driver) {
        vData.driverId = vUserId
        delete vData.userId
      }
      const vResponse: ITripInstance | null = await ClassTripService.update(vData)
      if (!vResponse) {
        return pRes.status(404).send(fxErrorResponse(404, null, 'No se encontro el recurso'))
      }
      if (vData.price) {
        const vUpdateTripPaymentData = {
          tripId: vResponse?.dataValues.id || null,
          amount: vData.price || null,
        }
        await ClassTripPaymentService.updatePrice(vUpdateTripPaymentData)
      }
      const vInitRoute: ITripRouteInput = pReq.input('initRoute', 'json')
      const vEndRoute: ITripRouteInput = pReq.input('endRoute', 'json')
      const vTripDelivery: ITripDeliveryInput = pReq.input('delivery', 'json')
      const vTripTravel: ITripTravelInput = pReq.input('travel', 'json')
      const vTripCancellation: ITripCancellationOptionInput = pReq.input('tripCancellation', 'json')
      if (vInitRoute && vEndRoute) {
        const vCreateRoutes: ITripRouteInput[] = []
        vCreateRoutes.push(vInitRoute)
        vCreateRoutes.push(vEndRoute)
        await ClassTripRouteService.createMany(vCreateRoutes)
      }
      if (vTripDelivery) {
        await ClassTripDeliveryService.update(vTripDelivery)
      }
      if (vTripTravel) {
        await ClassTripTravelService.update(vTripTravel)
      }
      if (vTripCancellation) {
        vTripCancellation.userId = vUserId
        vTripCancellation.tripId = vData.id
        await ClassTripCancellationOptionService.create(vTripCancellation)
      }
      if (vData.status === EStatusTrip.CANCELADO) {
        const initRoute = await ClassTripRouteService.showByTripId({
          tripId: vData.id,
        })
        if (vResponse?.dataValues?.driverId) {
          const updateDriver = {
            id: vResponse.dataValues.driverId,
            statusDriver: EStatusDriver.ACTIVE,
          }
          await ClassAuthService.updateSocket(updateDriver)
        }
        const vParamToRange = {
          cityId: vResponse?.dataValues.cityId || null,
          regionId: vResponse?.dataValues.regionId || null,
          countryId: vResponse?.dataValues.countryId || null,
          isCar: vResponse?.dataValues.typeService === ETypeService.CAR,
          isMoto: vResponse?.dataValues.typeService === ETypeService.MOTO,
          isDelivery: vResponse?.dataValues.typeService === ETypeService.DELIVERY,
          isTravel: vResponse?.dataValues.typeService === ETypeService.TRAVEL,
        }
        const vDistance = await RangePriceService.showPriceToId(vParamToRange)
        const vParamNearbyDrivers = {
          lat: initRoute?.dataValues.lat,
          lon: initRoute?.dataValues.lon,
          distance: vDistance?.distanceToSearch || 30,
          typeService: vResponse?.dataValues.typeService,
          minAmount: Number(vResponse?.dataValues?.price),
          currencyId: vResponse.dataValues.currencyId
        }
        if (vParamNearbyDrivers?.lat && vParamNearbyDrivers?.lon) {
          const vNearbyDrivers = await ClassUserService.NearbyDrivers(vParamNearbyDrivers)
          const socketIds: any[] = vNearbyDrivers.map((vUser) => vUser.socketId)
          if (socketIds.length) {
            SocketService.io.to(socketIds).emit('cancelTrip', vResponse)
          }
        }

        if (pReq.auth.typeUser === ETypeUser.passenger && vResponse?.dataValues.driverId) {
          const vDriver = await ClassUserService.show({ id: vResponse.dataValues.driverId })
          if (vDriver?.dataValues.socketId) {
            if (vDriver?.dataValues.tokenPush) {
              const notificationData = {
                title: 'Tu pasajero ha cancelado el servicio',
                body: '¡Gracias por tu disposición!. Es momento de tomar otro viaje',
              }
              await NotificationService.sendNotification(
                [vDriver.dataValues.tokenPush],
                notificationData
              )
            }
            SocketService.io.to(vDriver.dataValues.socketId).emit('cancelTripActive', vResponse)
          }
        }
        if (pReq.auth.typeUser === ETypeUser.driver && vResponse?.dataValues.userId) {
          const vClient = await ClassUserService.show({ id: vResponse.dataValues.userId })
          if (vClient?.dataValues.socketId) {
            if (vClient?.dataValues.tokenPush) {
              const notificationData = {
                title: 'Tu conductor ha cancelado el servicio',
                body: 'Si tienes alguna duda, contacta a un operador',
              }
              await NotificationService.sendNotification(
                [vClient.dataValues.tokenPush],
                notificationData
              )
            }
            SocketService.io.to(vClient.dataValues.socketId).emit('cancelTripActive', vResponse)
          }
        }
      } else {
        const initRoute = await ClassTripRouteService.showByTripId({
          tripId: vData.id,
        })
        const vParamToRange = {
          cityId: vResponse?.dataValues.cityId || null,
          regionId: vResponse?.dataValues.regionId || null,
          countryId: vResponse?.dataValues.countryId || null,
          isCar: vResponse?.dataValues.typeService === ETypeService.CAR,
          isMoto: vResponse?.dataValues.typeService === ETypeService.MOTO,
          isDelivery: vResponse?.dataValues.typeService === ETypeService.DELIVERY,
          isTravel: vResponse?.dataValues.typeService === ETypeService.TRAVEL,
        }
        const vDistance = await RangePriceService.showPriceToId(vParamToRange)
        const vParamNearbyDrivers = {
          lat: initRoute?.dataValues.lat,
          lon: initRoute?.dataValues.lon,
          distance: vDistance?.distanceToSearch || 30,
          typeService: vResponse?.dataValues.typeService,
          minAmount: Number(vResponse?.dataValues?.price),
          currencyId: vResponse.dataValues.currencyId
        }
        if (vParamNearbyDrivers?.lat && vParamNearbyDrivers?.lon) {
          const vNearbyDrivers = await ClassUserService.NearbyDrivers(vParamNearbyDrivers)
          console.log('vNearbyDrivers update :>> ', vNearbyDrivers)
          const socketIds: any[] = vNearbyDrivers.map((vUser) => vUser.socketId)
          const tokenPushs: any[] = vNearbyDrivers.map((vUser) => vUser.dataValues.tokenPush)
          if (socketIds.length) {
            await SocketService.io.to(socketIds).emit('cancelTrip', vResponse)
          }
          const vParamTripShow = {
            id: Number(vData.id),
            userId: vUserId,
            isClient: true,
          }
          const vTripOne: ITripInstance | null = await ClassTripService.show(vParamTripShow)

          if (vTripOne) {
            // const ClassSendNotification = new NotificationService()
            const notificationData = {
              title: 'Nuevo viaje',
              body: 'Un nuevo viaje cerca de ti',
              data: JSON.stringify(vTripOne),
            }
            if (tokenPushs.length) {
              await NotificationService.sendNotification(tokenPushs, notificationData)
            }
          }
          if (socketIds.length) {
            SocketService.io.to(socketIds).emit('newTrip', vTripOne)
          }
        }
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: vResponse }))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vUserId: UUID = pReq.auth.id
      const vResponse: boolean = await ClassTripService.softDeleteRecord(vId, vUserId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }

  async hidden(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: any = pReq.input('id')
      const vUserId = pReq.auth.id
      if (vId) {
        await ClassTripService.hidden({
          id: vId,
          userId: vUserId,
        })
        return pRes.status(200).send(fxSuccessResponse(200, true, 'Borrado con exito'))
      }
      return pRes.status(404).send(fxErrorResponse(404, null, 'Ocurrio un error'))
    } catch (error) {
      pNext(error)
    }
  }

  async showPanic(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: IParamShowTrip = {
        id: pReq.input('id', 'number'),
        panic: true,
      }
      const socketId = pReq.input('socketId', 'string')
      await ClassTripService.updatePanic({
        tripId: vParam.id,
        socketId: socketId,
      })
      const vResponse: ITripInstance | null = await ClassTripService.showId(vParam)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: vResponse }, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async cancelTrip(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: { id: number, status: EStatusTrip } = {
        id: pReq.input('id', 'number'),
        status: EStatusTrip.ANULADO
      }
      const vResponse: ITripInstance | null = await ClassTripService.update(vParam)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'No es posible anular luego de finalizar el viaje'))
      }
      const driverId = vResponse?.dataValues.driverId
      const clientId = vResponse?.dataValues.userId
      if (driverId) {
        const dirver = await ClassUserService.show({ id: driverId })
        if (dirver?.dataValues.tokenPush) {
          const notificationData = {
            title: 'Tu servicio ha sido anulado',
            body: ' Por nuestro administrador, contactanos para aclarar dudas.',
          }
          await NotificationService.sendNotification(
            [dirver.dataValues.tokenPush],
            notificationData
          )
        }
        await SocketService.io.to(dirver?.dataValues?.socketId).emit('cancelTripActive', vResponse)
      }
      if (clientId) {
        const client = await ClassUserService.show({ id: clientId })
        if (client?.dataValues.tokenPush) {
          const notificationData = {
            title: 'Tu servicio ha sido anulado',
            body: ' Por nuestro administrador, contactanos para aclarar dudas.',
          }
          await NotificationService.sendNotification(
            [client.dataValues.tokenPush],
            notificationData
          )
        }
        await SocketService.io.to(client?.dataValues?.socketId).emit('cancelTripActive', vResponse)
      }

      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }
  // async recoveryTrip(pReq: Request, pRes: Response, pNext: NextFunction) {
  //   try {
  //     const vParam: IParamShowActiveTrip = {
  //       userId: pReq.auth.id,
  //     }
  //     const vResponse: ITripInstance | null = await ClassTripService.showActive(
  //       vParam,
  //     )
  //     if (!vResponse) {
  //       return pRes
  //         .status(200)
  //         .send(fxSuccessResponse(200, vResponse, 'Correcto', false))
  //     }
  //     if (vResponse.dataValues.status === EStatusTrip.CANCELADO) {
  //       const vTripOffer = await TripOffertService.showAcept(vResponse?.dataValues.id)
  //       const vDriverParam = {
  //         id: vTripOffer?.dataValues.driverId || '',
  //         isDriver: true,
  //       }
  //       const vDriverSocketId = await ClassUserService.show(vDriverParam)
  //       const vVehicleAdditionalService = await VehicleAdditionalService.allFilterIdArray(vDriverSocketId)
  //       const vDataNewTripOffert = {
  //         offer: vTripOffer,
  //         driver: vDriverSocketId,
  //         countTrips: vTripOffer?.dataValues.driverId ? await ClassTripService.countTrip(vTripOffer.dataValues.driverId) : 0,
  //         duration: vTripOffer?.dataValues.duration,
  //         distance: vTripOffer?.dataValues.distance,
  //         vehicleAdditionalService: vVehicleAdditionalService
  //       }
  //       const vReponseJSON = JSON.parse(JSON.stringify(vResponse))
  //       vReponseJSON.dataDriver = vDataNewTripOffert
  //       return pRes.status(200).send(fxSuccessResponse(200, vReponseJSON, 'Correcto'))
  //     }
  //   } catch (error) {
  //     pNext(error)
  //   }
  // }
}
export default new TripController()
