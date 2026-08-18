/* 
- File: UserController.ts

- Purpose: Es el controlador de User se encarga de los comentarios de los usuarios
- Author: Jairo Belen

- Creation: 17/03/2024  
 */
import type { NextFunction, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import ClassUser from '../../services/User/UserService'
import { type IUserInput, type IResponseAllUser, ETypeUser } from '../../types/User'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { IUserInstance } from '../../models/User/UserModel'
import ClassVerifyService from '../../services/User/VerifyService'
import { EStatusVerify } from '../../models/User/VerifyModel'
import TripService from '../../services/Trip/TripService'
import NotificationService from '../fcmPushController'

class UserController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = pReq.input('id', 'string')
      const vIsDriver: boolean = pReq.input('isDriver', 'json') ?? false
      const vResponse: IUserInstance | null = await ClassUser.show({
        id: vId,
        isDriver: vIsDriver || false,
      })
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      const vReponseUser = {
        ...vResponse.dataValues,
        count: await TripService.countTrip(vResponse.dataValues.id, vResponse.dataValues.typeUser),
      }
      return pRes.status(200).send(fxSuccessResponse(200, vReponseUser, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAllUser | IUserInstance[] = await ClassUser.all(vParam)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async operatorAll(_pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vResponse: IResponseAllUser | IUserInstance[] = await ClassUser.operatorAll()
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async location(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAllUser | IUserInstance[] = await ClassUser.location(vParam)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      // let vResponseJSON = []
      // if ('data' in vResponse) {
      //   vResponseJSON = JSON.parse(JSON.stringify(vResponse.data))
      // } else {
      //   vResponseJSON = JSON.parse(JSON.stringify(vResponse))
      // }
      // for (const user of vResponseJSON) {
      //   if (!user.driverRating) {
      //     user.driverRating = {
      //       quantity: 0,
      //       ratings: 5,
      //     }
      //   }
      // }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      console.log('error :>> ', error)
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
        'password',
      ])
      // Opcional: solo lo usan flujos como "crear dueño de tienda" desde el admin, donde el
      // usuario necesita poder loguearse despues. Si no viene, el usuario queda sin clave
      // (mismo comportamiento de antes) hasta que se registre/actualice por otro medio.
      if (typeof vData.password === 'string' && vData.password) {
        vData.password = bcrypt.hashSync(vData.password, 10)
      }
      await ClassUser.validate(vData)
      const vResponse: IUserInstance | null = await ClassUser.create(vData)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }

      if (vData.typeUser === '2') {
        const verifyData = {
          userId: vResponse.id,
          status: EStatusVerify.verifying,
        }
        await ClassVerifyService.create(verifyData)
      }

      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IUserInput = pReq.only([
        'id',
        'name',
        'lastName',
        'email',
        'rolId',
        'status',
        'statusDriver',
        'verifiedDriver',
        'typeUser',
        'daiFood',
        'daiMarket',
      ])
      if (vData.typeUser === ETypeUser.driver && vData?.id) {
        const vUserDB: IUserInstance | null = await ClassUser.show({
          id: vData.id,
          isDriver: true,
        })
        if (vData.verifiedDriver && !vUserDB?.dataValues?.verifiedDriver && vUserDB?.dataValues?.tokenPush) {
          const notificationData = {
            title: 'Usuario activado',
            body: 'Ya puedes comenzar a usar DAI, te esperamos',
          }
          await NotificationService.sendNotification(
            [vUserDB.dataValues.tokenPush],
            notificationData
          ) 
        }
      }
      const vResponse: IUserInstance | null = await ClassUser.update(vData)
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

  async suspended(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IUserInput = pReq.only([
        'id',
        'status',
      ])
      const vResponse: IUserInstance | null = await ClassUser.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
      console.log('error :>> ', error)
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'string')
      const vResponse: boolean = await ClassUser.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new UserController()
