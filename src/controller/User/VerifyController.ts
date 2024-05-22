/* 
- File: VerifyController.ts

- Purpose: Es el controlador de auth de verificaciones, se encargar de verificar las cuentas de los conductores
- Author: Jairo Belen

- Creation: 29/03/2024  

==========Functions Manifest==========

- Paya Methods:
Para todos los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- show: Sirve un dato especifico filtrado por el id

2 - all: Sirve todos los datos guardados o paginado

3 - update: Cumple la funcion de recibir todos los datos que se pueden actualizar luego los envia a guardar en el servicio

4 - create: Esto es en caso de que en un futuro necesitos crear nuevos pero lo mas probable nunca se use

 */
import type { NextFunction, Request, Response } from 'express'
import ClassVerifyService from '../../services/User/VerifyService'
import type { IResponseAllVerify, IVerifyInput } from '../../types/User'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import { EStatusVerify, type IVerifyInstance } from '../../models/User/VerifyModel'
import { modelUser } from '../../models'
import NotificationService from '../fcmPushController'

class VerifyController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: IVerifyInstance | null = await ClassVerifyService.show(vId)
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

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAllVerify | IVerifyInstance[] = await ClassVerifyService.all(vParam)
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
      const vData: IVerifyInput = pReq.only(['userId', 'appeal', 'reason', 'status'])
      const driverId = pReq.input('driverId')
      vData.userId = driverId || vData.userId
      vData.status = EStatusVerify.denied
      const vResponse: IVerifyInstance | null = await ClassVerifyService.create(vData)
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
      const vData: IVerifyInput = pReq.only(['id', 'userId', 'appeal', 'reason', 'status'])
      const vVerifyId = pReq.input('verifyId', 'number') || null
      vData.id = vVerifyId || vData.id
      console.log('vData :>> ', vData)

      if (!vData?.id) {
        const user = await modelUser.findOne({ where: { id: vData.userId } })
        if (user) {
          user.verifiedDriver = true
          await user.save()
          if (user?.dataValues.tokenPush) {
            console.log('tiene token push')
            const notificationData = {
              title: 'Usuario activado',
              body: 'Ya puedes comenzar a usar PaYa, te esperamos',
            }
            await NotificationService.sendNotification(
              [user.dataValues.tokenPush],
              notificationData
            )
            console.log('deberia notificar')
          }
        }
        return pRes.status(200).send(fxSuccessResponse(200, true, 'Correcto'))
      }
      const vResponse: IVerifyInstance | null = await ClassVerifyService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (Number(vResponse.status) === EStatusVerify.verified) {
        console.log('paso por aca')
        const user = await modelUser.findOne({ where: { id: vResponse.userId } })
        if (user) {
          user.verifiedDriver = true
          await user.save()
        }
        if (user?.dataValues.tokenPush) {
          console.log('tiene token push')
          const notificationData = {
            title: 'Usuario activado',
            body: 'Ya puedes comenzar a usar PaYa, te esperamos',
          }
          await NotificationService.sendNotification(
            [user.dataValues.tokenPush],
            notificationData
          )
          console.log('deberia notificar')
        }
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      console.log('error :>> ', error)
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassVerifyService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new VerifyController()
