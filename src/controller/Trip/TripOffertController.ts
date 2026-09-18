/* 
- File: TripOffertController.ts

- Purpose: Es el controlador de auth de TripOffert se encarga de la oferta monetaria de cada viaje

- Creation: 15/02/2024  

==========Functions Manifest==========

- Dai Methods:
Para todo los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- show: Sirve un dato especifico filtrado por el id

2 - all: Sirve todos los datos guardados o paginado

3 - update: Cumple la funcion de recibir todos los datos que se pueden actualizarluego los envia a guardar en el servicio

4 - create: Esto es en caso de que en un futuro necesitos crear nuevos pero lo mas probable nunca se use

 */
import type { NextFunction, Request, Response } from 'express'
import ClassTripOffertService from '../../services/Trip/TripOffertService'
import type { ITripOffertInput, IResponseAllTripOffert, IParamShowTrip } from '../../types/TripType'
import { fxSuccessResponse, fxErrorResponse, withTimeout } from '../../utils/helpers'
import { ETripOffertStatus, type ITripOffertInstance } from '../../models/Trip/TripOffertModel'
import { SocketService } from '../../ws'
import ClassUserService from '../../services/User/UserService'
import NotificationService from '../fcmPushController'
import ClassTripService from '../../services/Trip/TripService'
import { ETypeUser } from '../../types/User'
import { EStatusTrip, type ITripInstance } from '../../models/Trip/TripModel'
import ClassVehicleAdditionalService from '../../services/Vehicle/VehicleAdditionalService'
import { PushMessages } from '../../constants/pushMessages'

class TripOffertController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: ITripOffertInstance | null = await ClassTripOffertService.show(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAllTripOffert | ITripOffertInstance[] =
        await ClassTripOffertService.all(vParam)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vUserAuth = pReq.auth
      const vData: ITripOffertInput = pReq.only([
        'tripId',
        'clientId',
        'currencyId',
        'driverId',
        'amount',
        'duration',
        'durationInMs',
        'distance',
        'status',
      ])
      vData.driverId = vUserAuth.id
      const vParamTrip: IParamShowTrip = {
        id: vData.tripId,
        isClient: vUserAuth?.typeUser === ETypeUser.passenger ? true : false,
        userId: vUserAuth.id,
        isDriver: vUserAuth?.typeUser === ETypeUser.driver ? true : false,
      }
      const trip: ITripInstance | null = await ClassTripService.showId(vParamTrip)
      if (!trip) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Trip no encontrado'))
      }
      // QA Sprint 3 #12: sin esto, un conductor podia ofertar (y notificarle al pasajero) sobre
      // un viaje que ya estaba cancelado/anulado/finalizado/aceptado por otro conductor.
      if (trip.dataValues?.status !== EStatusTrip.PENDIENTE) {
        return pRes
          .status(400)
          .send(fxErrorResponse(400, null, 'Este viaje ya no esta disponible para ofertar'))
      }
      vData.clientId = trip.dataValues?.userId
      vData.status = ETripOffertStatus.ESPERA
      const vResponse: ITripOffertInstance | null = await ClassTripOffertService.create(vData)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'No se pudo crear la oferta'))
      }
      const vDriverParam = {
        id: vData.driverId,
        isDriver: true,
      }
      const vDriverSocketId = await ClassUserService.show(vDriverParam)
      const vTripOffer: ITripOffertInstance | null = await ClassTripOffertService.show(
        Number(vResponse?.dataValues.id)
      )
      const vVehicleAdditionalService =
        await ClassVehicleAdditionalService.allFilterIdArray(vDriverSocketId)
      const vDataNewTripOffert = {
        offer: vTripOffer,
        driver: vDriverSocketId,
        countTrips: await ClassTripService.countTrip(vData.driverId),
        duration: vData.duration,
        distance: vData.distance,
        vehicleAdditionalService: vVehicleAdditionalService,
      }
      const vClientParam = {
        isClient: true,
        id: vData.clientId,
      }
      const vClientSocketId = await ClassUserService.show(vClientParam)
      if (vClientSocketId?.dataValues?.socketId) {
        try {
          await SocketService.io.to(vClientSocketId.dataValues.socketId).emit(
            'newTripOffer',
            vDataNewTripOffert,
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
      }
      if (vClientSocketId?.dataValues?.tokenPush && vDataNewTripOffert) {
        const tokenPush = vClientSocketId?.dataValues?.tokenPush
        const VnotificationDataDriver = {
          offer: vResponse,
          driver: {
            name: vDriverSocketId?.dataValues.name,
            icon: vDriverSocketId?.dataValues.avatar,
          },
          countTrips: await ClassTripService.countTrip(vData.driverId),
          duration: vData.duration,
          distance: vData.distance,
        }
        await NotificationService.sendNotification([tokenPush], {
          ...PushMessages.nuevaOfertaParaCliente(),
          data: JSON.stringify(VnotificationDataDriver),
        })
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ITripOffertInput = pReq.only([
        'id',
        'tripId',
        'clientId',
        'driverId',
        'amount',
        'status',
      ])
      const vResponse: ITripOffertInstance | null = await ClassTripOffertService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = pReq.input('id', 'number')
      const vResponse: boolean = await ClassTripOffertService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new TripOffertController()
