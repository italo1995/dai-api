/* 
- File: ReviewController.ts

- Purpose: Es el controlador de auth de review se encarga de lo relacionado a las calificaciones de los clientes 
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
import ClassReviewService from '../services/ReviewService'
import type { IReviewInput, IResponseAllReview } from '../types/webTypes'
import { fxSuccessResponse, fxErrorResponse } from '../utils/helpers'
import type { IReviewInstance } from '../models/ReviewModel'
import ClassUserRatingService from '../services/User/UserRatingService'
import ClassTripService from '../services/Trip/TripService'
import type { IParamShowTrip } from '../types/TripType'
import { ETypeUser } from '../types/User'

class ReviewController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: IReviewInstance | null = await ClassReviewService.show(vId)
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

  async all (pReq:Request, pRes: Response, pNext: NextFunction) {
    try{
      const vParam: any = pReq.query
      const vResponse: IResponseAllReview | IReviewInstance[] = await ClassReviewService.all(vParam)
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
      const vData: IReviewInput = pReq.only([
        'qualification',
        'comment',
        'tripId'
      ])
      vData.features = false
      if (!vData.tripId) {
        // TODO://
        return pRes
          .status(400)
          .send(fxErrorResponse(400, { user: null, token: null }, 'tripId es requerido'))
      }
      const vParamTrip: IParamShowTrip = {
        id: vData.tripId,
        isClient: vUserAuth?.typeUser === ETypeUser.passenger ? true : false,
        userId: vUserAuth.id,
        isDriver: vUserAuth?.typeUser === ETypeUser.driver ? true : false
      }
      console.log('vParamTrip :>> ', vParamTrip)
      const trip = await ClassTripService.show(vParamTrip)
      if (!trip?.dataValues.id) {
        // TODO://
        return pRes
          .status(400)
          .send(fxErrorResponse(400, { user: null, token: null }, 'Trip no existe'))
      }
      vData.tripId = trip?.dataValues.id
      vData.clientId = trip.dataValues?.userId
      vData.driverId = trip.dataValues?.driverId || ''
      let type, userId

      if (vData.clientId) {
        type = 'client'
        userId = vData.clientId
      } else if (vData.driverId) {
        type = 'driver'
        userId = vData.driverId
      } else {
        return pRes
          .status(400)
          .send(fxErrorResponse(400, { user: null, token: null }, 'Review must have either clientId or driverId'))
      }

      const vResponse: IReviewInstance | null = await ClassReviewService.create(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }

      // Actualizar la calificación del usuario
      await ClassUserRatingService.updateRating(userId, type)

      return pRes
        .status(200)
        .send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IReviewInput = pReq.only([
        'id',
        'clientId',
        'driverId',
        'qualification',
        'comment',
        'features',
        'tripId'
      ])
      const vResponse: IReviewInstance | null = await ClassReviewService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null}, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  }
  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassReviewService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }


}

export default new ReviewController()