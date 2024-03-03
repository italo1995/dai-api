/* 
- File: TripCancellationOptionController.ts

- Purpose: Es el controlador de auth de TripCancellationOption se encarga de la oferta monetaria de cada viaje

- Creation: 15/02/2024  

==========Functions Manifest==========

- Paya Methods:
Para todo los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- show: Sirve un dato especifico filtrado por el id

2 - all: Sirve todos los datos guardados o paginado

3 - update: Cumple la funcion de recibir todos los datos que se pueden actualizarluego los envia a guardar en el servicio

4 - create: Esto es en caso de que en un futuro necesitos crear nuevos pero lo mas probable nunca se use

 */
import type { NextFunction, Request, Response } from 'express'
import ClassTripCancellationOptionService from '../../services/Trip/TripCancellationOptionService'
import type { ITripCancellationOptionInput, IResponseAllTripCancellationOption } from '../../types/TripType'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import { type ITripCancellationOptionInstance } from '../../models/Trip/TripCancellationOptionModel'

class TripCancellationOptionController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: ITripCancellationOptionInstance | null = await ClassTripCancellationOptionService.show(vId)
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

  async all(pReq:Request, pRes: Response, pNext: NextFunction) {
    try{
      const vParam: any = pReq.query
      const vResponse: IResponseAllTripCancellationOption | ITripCancellationOptionInstance[] = await ClassTripCancellationOptionService.all(vParam)
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
      const auth = pReq.auth
      const vData: ITripCancellationOptionInput = pReq.only([
        'tripId',
        'cancellationOptionId',
        'comment',
      ])
      vData.userId = auth.id
      const vResponse: ITripCancellationOptionInstance | null = await ClassTripCancellationOptionService.create(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) { 
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const auth = pReq.auth
      const vData: ITripCancellationOptionInput = pReq.only([
        'id',
        'tripId',
        'cancellationOptionId',
        'comment',
      ])
      vData.userId = auth.id
      const vResponse: ITripCancellationOptionInstance | null = await ClassTripCancellationOptionService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  }
  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = pReq.input('id')
      const vResponse: number = await ClassTripCancellationOptionService.destroy(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, false, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, true, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new TripCancellationOptionController()