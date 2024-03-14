/* 
- File: UserTransactionController.ts

- Purpose: Es el controlador de UserTransaction se encarga de los tramites que se cada cliente hace dentro de la aplicacion
- Author: Jairo Belen

- Creation: 13/03/2024  
 */
import type { NextFunction, Request, Response } from 'express'
import ClassUserTransactionService from '../../services/User/UserTransactionService'
import type { IUserTransactionInput, IResponseAllUserTransaction } from '../../types/User'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { IUserTransactionInstance } from '../../models/User/UserTransactionModel'

class UserTransactionController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: IUserTransactionInstance | null = await ClassUserTransactionService.show(vId)
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
      const vResponse: IResponseAllUserTransaction | IUserTransactionInstance[] = await ClassUserTransactionService.all(vParam)
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
      const vData: IUserTransactionInput = pReq.only([
        'userId',
        'operatorId',
        'amount',
        'transactionType',
        'status'
      ])
      const vResponse: IUserTransactionInstance | null = await ClassUserTransactionService.create(pReq?.auth, vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IUserTransactionInput = pReq.only([
        'id',
        'userId',
        'operatorId',
        'amount',
        'transactionType',
        'status'
      ])
      const vResponse: IUserTransactionInstance | null = await ClassUserTransactionService.update(pReq?.auth, vData)
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
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassUserTransactionService.softDeleteRecord(vId)
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

export default new UserTransactionController()