/*
- File: StoreRatingController.ts

- Purpose: Calificaciones de tiendas. Calificar exige estar logueado (cualquier cliente, sin
  atarlo a una orden real por ahora - no existe aun el modulo de Ordenes del marketplace).
  Moderacion (listar para admin, borrar) es exclusiva de admin/operator.

==========Functions Manifest==========
Para todos los casos, si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1 - show: trae una calificacion por id
2 - all: lista publica de comentarios de una tienda (?storeId=X), paginada
3 - allAdmin: lista paginada/buscable para moderacion (solo admin/operator)
4 - rate: crea o actualiza la calificacion del usuario logueado para una tienda
5 - destroy: elimina (soft delete) una calificacion (solo admin/operator)
*/
import type { NextFunction, Request, Response } from 'express'
import ClassStoreRatingService from '../../services/Store/StoreRatingService'
import type { IStoreRatingInput } from '../../types/StoreRating'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { IStoreRatingInstance } from '../../models/Store/StoreRatingModel'

class StoreRatingController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)
      const vResponse: IStoreRatingInstance | null = await ClassStoreRatingService.show(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      if (!pReq.query.storeId) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'storeId es requerido'))
      }
      const vParam: any = pReq.query
      const vResponse = await ClassStoreRatingService.all(vParam)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async allAdmin(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse = await ClassStoreRatingService.allAdmin(vParam)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async rate(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData: IStoreRatingInput = pReq.only(['storeId', 'rating', 'comment'])
      vData.userId = vAuth.id
      if (!vData.storeId || !vData.rating) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'storeId y rating son requeridos'))
      }
      if (vData.rating < 1 || vData.rating > 5) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'rating debe estar entre 1 y 5'))
      }
      const vResponse: IStoreRatingInstance = await ClassStoreRatingService.rate(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassStoreRatingService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new StoreRatingController()
