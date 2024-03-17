/* 
- File: CommentController.ts

- Purpose: Es el controlador de Comment se encarga de los comentarios de los usuarios
- Author: Jairo Belen

- Creation: 17/03/2024  
 */
import type { NextFunction, Request, Response } from 'express'
import ClassComment from '../../services/User/CommentService'
import type { ICommentInput, IResponseAllComment } from '../../types/User'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { ICommentInstance } from '../../models/User/CommentModel'

class CommentController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: ICommentInstance | null = await ClassComment.show(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes
        .status(200)
        .send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all (pReq:Request, pRes: Response, pNext: NextFunction) {
    try{
      const vParam: any = pReq.query
      const vResponse: IResponseAllComment | ICommentInstance[] = await ClassComment.all(vParam)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes
        .status(200)
        .send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ICommentInput = pReq.only([
        'userId',
        'name',
        'description',
        'paremtId',
        'serviceId'
        
      ])
      const vResponse: ICommentInstance | null = await ClassComment.create(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes
        .status(200)
        .send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ICommentInput = pReq.only([
        'id',
        'userId',
        'name',
        'description',
        'paremtId',
        'serviceId'
      ])
      const vResponse: ICommentInstance | null = await ClassComment.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null}, 'Ocurrio un error'))
      }
      return pRes
        .status(200)
        .send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassComment.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes
        .status(200)
        .send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new CommentController()