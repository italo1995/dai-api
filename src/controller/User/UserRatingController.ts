import type { NextFunction, Request, Response } from 'express'
import ClassUserRatingService from '../../services/User/UserRatingService'
import type { IResponseAllUserRating, IUserRatingInput } from '../../types/User'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { IUserRatingInstance } from '../../models/User/UserRatingModel'

class UserRatingController {
  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAllUserRating | IUserRatingInstance[] =
        await ClassUserRatingService.all(vParam)
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

  async updateAverageRating(pReq: Request, pRes: Response) {
    try {
      const userId = pReq.params.userId
      const type = pReq.params.type // Asegúrate de que 'type' se pasa como un parámetro
      await ClassUserRatingService.updateRating(userId, type)
      return pRes.status(200).send({ message: 'Calificación del usuario actualizada con éxito' })
    } catch (error) {
      console.error(error)
      return pRes
        .status(500)
        .send({ message: 'Ocurrió un error al actualizar la calificación del usuario' })
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassUserRatingService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IUserRatingInput = pReq.only([
        'id',
        'userId',
        'type',
        'ratings',
        'averageRating',
        'quantity',
      ])
      const vResponse: IUserRatingInstance | null = await ClassUserRatingService.update(vData)
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

  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: IUserRatingInstance | null = await ClassUserRatingService.show(vId)
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
      const vData: IUserRatingInput = pReq.only([
        'userId',
        'type',
        'ratings',
        'averageRating',
        'quantity',
      ])
      const vResponse: IUserRatingInstance | null = await ClassUserRatingService.create(vData)
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
}

export default new UserRatingController()
