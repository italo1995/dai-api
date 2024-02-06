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
import type { ITripInput, IResponseAllTrip } from '../../types/TripType'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { ITripInstance } from '../../models/Trip/TripRouteModel'

class TripController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vUserId: UUID = pReq.auth.id
      const vId: number = Number(pReq.query.id)

      const vResponse: ITripInstance | null = await ClassTripService.show(
        vId,
        vUserId
      )
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: vResponse }, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vUserId = pReq.auth.id
      vParam.userId = vUserId
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
        'currencyId',
        'isPayment'
      ])
      vData.userId = vUserId
      const vResponse: ITripInstance | null = await ClassTripService.create(vData)
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

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ITripInput = pReq.only([
        'id',
        'typeService',
        'userId',
        'driverId',
        'date',
        'status',
        'price',
        'currencyId',
        'isPayment'
      ])
      const vUserId = pReq.auth.id
      vData.userId = vUserId
      const vResponse: ITripInstance | null = await ClassTripService.update(vData)
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
