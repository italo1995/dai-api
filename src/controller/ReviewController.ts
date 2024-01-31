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
      return pRes.status(200).send(fxSuccessResponse(200, { data: vResponse }, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all (pReq:Request, pRes: Response, pNext: NextFunction) {
    try{
      const vParam: any = pReq.query
      const vReponse: IResponseAllReview | IReviewInstance[] = await ClassReviewService.all(vParam)
      if (!vReponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data:vReponse }, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IReviewInput = pReq.only([
        'name',
      ])
      const vReponse: IReviewInstance | null = await ClassReviewService.create(vData)
      if (!vReponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: vReponse }, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IReviewInput = pReq.only([
        'id',
        'name',
      ])
      const vReponse: IReviewInstance | null = await ClassReviewService.update(vData)
      if (!vReponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null}, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: vReponse }, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  }

}

export default new ReviewController()