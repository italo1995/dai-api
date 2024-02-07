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
import type { ITripInput, IResponseAllTrip, IParamAllTrip, IParamShowTrip, ITripRouteInput } from '../../types/TripType'
import { fxSuccessResponse, fxErrorResponse, moveImages } from '../../utils/helpers'
import type { ITripInstance } from '../../models/Trip/TripModel'
import ClassTripPaymentService from '../../services/Trip/TripPaymentService'

class TripController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: IParamShowTrip = {
        userId: pReq.auth.id,
        isClient: pReq.input('isClient', 'json'),
        isDriver: pReq.input('isDriver', 'json'),
        id: pReq.input('id', 'number')
      }
      if (vParam.id === undefined) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'El id es requerido'))
      }
      if (vParam.isClient === undefined && vParam.isDriver === undefined) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Se requiere isClient o isClient'))
      }
      const vResponse: ITripInstance | null = await ClassTripService.show(
        vParam,
      )
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: vResponse }, 'Correcto'))
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
        pag: Number(pReq.query?.pag) || null,
        limit: Number(pReq.query?.limit) || null,
      }
      if (vParam.isClient === undefined && vParam.isDriver === undefined) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Se requiere isClient o isClient'))
      }
      const vResponse: IResponseAllTrip | ITripInstance[] =
        await ClassTripService.all(vParam)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
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
        'currencyId'
      ])
      const vFee = pReq.input('fee', 'json')
      vData.price = vData?.price || vFee?.price
      vData.currencyId = vData?.currencyId || vFee?.currencyId
      vData.userId = vUserId
      const vInitRoute = pReq.input('initRoute', 'json')
      const vEndRoute = pReq.input('endRoute', 'json')
      const vTripPayment = pReq.input('PaymentMethod ', 'json')
      if (vInitRoute === undefined || vEndRoute === undefined) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Se requieren las rutas'))
      }
      const vResponse: ITripInstance | null = await ClassTripService.create(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (vTripPayment) {
        vTripPayment.tripId = vResponse.dataValues.id
        await ClassTripPaymentService.create(vTripPayment)
      }
      if (vInitRoute && vEndRoute) {
        const vCreateRoutes: ITripRouteInput[] = []
        const vCreateInitRoute: ITripRouteInput = {
          ...vInitRoute,
          tripId: vResponse.dataValues.id
        }
        if (vCreateInitRoute?.referencePointImage) {
          vCreateInitRoute.referencePointImage = await moveImages(vCreateInitRoute.referencePointImage)
        }
        vCreateRoutes.push(vCreateInitRoute)
        const vCreateEndRoute: ITripRouteInput = {
          ...vEndRoute,
          tripId: vResponse.dataValues.id
        }
        vCreateRoutes.push(vCreateEndRoute)
        await ClassTripRouteService.createMany(vCreateRoutes)
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vUserId = pReq.auth.id
      const vData: ITripInput = pReq.only([
        'id',
        'userId',
        'driverId',
        'date',
        'status',
        'price',
        'currencyId',
      ])
      const vIsClient = pReq.input('isClient')
      const vIsDriver = pReq.input('isDriver')
      if (vIsClient === undefined && vIsDriver === undefined) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Se requiere isClient o isClient'))
      }
      if (vIsClient) {
        vData.userId = vUserId
      }else if (vIsDriver) {
        vData.driverId = vUserId
      }
      const vResponse: ITripInstance | null = await ClassTripService.update(vData)
      const vInitRoute: ITripRouteInput = pReq.input('initRoute', 'json')
      const vEndRoute: ITripRouteInput = pReq.input('endRoute', 'json')
      if (vInitRoute && vEndRoute) {
        const vCreateRoutes: ITripRouteInput[] = []
        vCreateRoutes.push(vInitRoute)
        vCreateRoutes.push(vEndRoute)
        await ClassTripRouteService.createMany(vCreateRoutes)
      }
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: null }, 'Ocurrio un error'))
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
}
export default new TripController()
