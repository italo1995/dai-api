/* 
- File: UserController.ts

- Purpose: Es el controlador de User se encarga de los comentarios de los usuarios
- Author: Jairo Belen

- Creation: 17/03/2024  
 */
import type { NextFunction, Request, Response } from 'express'
import ClassUser from '../../services/User/UserService'
import type { IUserInput, IResponseAllUser } from '../../types/User'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { IUserInstance } from '../../models/User/User'

class UserController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = pReq.input('id', 'string')

      const vResponse: IUserInstance | null = await ClassUser.show({ id: vId, isDriver: false })
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes
        .status(200)
        .send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq:Request, pRes: Response, pNext: NextFunction) {
    try{
      const vParam: any = pReq.query
      const vResponse: IResponseAllUser | IUserInstance[] = await ClassUser.all(vParam)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
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
      const vData: IUserInput = pReq.only([
        'name',
        'email',
        'phoneCode',
        'phoneNumber',
        'rolId',
        'status',
        'statusDriver',
        'verifiedDriver',
        'typeUser',
      ])
      const vResponse: IUserInstance | null = await ClassUser.create(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
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
      const vData: IUserInput = pReq.only([
        'id',
        'name',
        'email',
        'phoneCode',
        'phoneNumber',
        'rolId',
        'status',
        'statusDriver',
        'verifiedDriver',
        'typeUser',
      ])
      const vResponse: IUserInstance | null = await ClassUser.update(vData)
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
      const vResponse: boolean = await ClassUser.softDeleteRecord(vId)
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

export default new UserController()