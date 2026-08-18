/* 
- File: SuspensionController.ts

- Purpose: Es el controlador de auth de suspensiones, se encarga de las suspensiones de los drivers
- Author: Jairo Belen

- Creation: 28/03/2024  

==========Functions Manifest==========

- Dai Methods:
Para todos los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- show: Sirve un dato especifico filtrado por el id

2 - all: Sirve todos los datos guardados o paginado

3 - update: Cumple la funcion de recibir todos los datos que se pueden actualizar luego los envia a guardar en el servicio

4 - create: Esto es en caso de que en un futuro necesitos crear nuevos pero lo mas probable nunca se use

 */
import type { NextFunction, Request, Response } from 'express'
import ClassSuspensionService from '../../services/User/SuspensionService'
import type { IResponseAllSuspension, ISuspensionInput } from '../../types/User'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import { ETypeTime, type ISuspensionInstance } from '../../models/User/SuspensionModel'
import { modelUser } from '../../models'
import { addYears, addHours } from 'date-fns'
import NotificationService from '../fcmPushController'

class SuspensionController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: ISuspensionInstance | null = await ClassSuspensionService.show(vId)
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
      if (pReq.auth.rolId === 3) {
        vParam.driverId = pReq.auth.id
      }
      
      const vResponse: IResponseAllSuspension | ISuspensionInstance[] =
        await ClassSuspensionService.all(vParam)
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
      const adminId = pReq.auth.id
      const vData: ISuspensionInput = pReq.only([
        'driverId',
        'reason',
        'hours',
        'timeFrame',
        'init',
        'end',
        'isCanceled',
      ])
      vData.adminId = adminId
      const hours = pReq.input('hours', 'number')
      const existingSuspension = await ClassSuspensionService.findActiveSuspension(vData.driverId)
      if (existingSuspension) {
        return pRes
          .status(400)
          .send(
            fxErrorResponse(
              400,
              { user: null, token: null },
              'El conductor ya tiene una suspension activa'
            )
          )
      }
      vData.init = new Date()
      vData.isCanceled = false
      switch (Number(vData.timeFrame)) {
      case ETypeTime.indefinido:
        vData.end = addYears(vData.init, 100)
        break

      case ETypeTime.hoy:
        vData.end = addHours(vData.init, 24)
        break

      case ETypeTime.horas:
        if (!hours) {
          throw new Error('Debes proporcionar la cantidad de horas para la suspension')
        }
        vData.end = addHours(vData.init, hours)
        break

      case ETypeTime.fecha:
        if (!vData.end) {
          throw new Error('Debes proporcionar una fecha específica para cancelar la suspension')
        } else {
          const vEnd: any = pReq.input('end')?.split('-')
          const vEndDate = new Date(vEnd[0], vEnd[1] - 1, vEnd[2], 23, 59, 0)
          vData.end = vEndDate
          vData.init = pReq.input('init')
        }
        break
      }

      const vResponse: ISuspensionInstance | null = await ClassSuspensionService.create(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      const user = await modelUser.findOne({ where: { id: vResponse.driverId } })
      if (user) {
        user.driverSuspendedTo = vResponse.end
        await user.save()
      }
      // if (user?.dataValues.phoneCode && user?.dataValues.phoneNumber) {
      //   fxSendMessageTextDinamic({
      //     phoneCode: user?.dataValues.phoneCode,
      //     phoneNumber: user?.dataValues.phoneNumber,
      //     text: `Ha sido suspendido en DAI hasta: ${vResponse.end.toLocaleString()}`
      //   })
      // }
      if (user?.dataValues.tokenPush) {
        const notificationData = {
          title: '¡Tu cuenta ha sido suspendida!',
          body: `${vData.reason}, hasta: ${vResponse.end.toLocaleString()}, Contacta a un operador para aclarar tus dudas.`,
        }
        await NotificationService.sendNotification(
          [user.dataValues.tokenPush],
          notificationData
        )
      }
      const message = `La suspensión del conductor fue generada hasta ${vResponse.end.toLocaleString()}`
      return pRes
        .status(200)
        .send(
          fxSuccessResponse(
            200,
            { suspension: vResponse, message: message },
            'Suspension creada con éxito'
          )
        )
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ISuspensionInput = pReq.only([
        'id',
        'driverId',
        'reason',
        'init',
        'end',
        'isCanceled',
      ])
      const user = await modelUser.findOne({ where: { id: vData.driverId } })
      if (user) {
        user.driverSuspendedTo = null
        await user.save()
      } else {
        return pRes.status(200).send(fxSuccessResponse(500, null, 'Correcto'))
      }
      // if (user?.dataValues.phoneCode && user?.dataValues.phoneNumber) {
      //   fxSendMessageTextDinamic({
      //     phoneCode: user?.dataValues.phoneCode,
      //     phoneNumber: user?.dataValues.phoneNumber,
      //     text: `Tu usuario ${user.dataValues.name} ha sido activado en DAI`
      //   })
      // }
      if (user?.dataValues.tokenPush) {
        const notificationData = {
          title: '¡Tu cuenta ha sido habilitada!',
          body: 'Ya puedes trabajar con nosotros nuevamente ¡Eso es DAI!',
        }
        await NotificationService.sendNotification(
          [user.dataValues.tokenPush],
          notificationData
        )
      }
      if (vData?.id) {
        const vResponse: ISuspensionInstance | null = await ClassSuspensionService.update(vData)
        if (!vResponse) {
          return pRes
            .status(500)
            .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
        }
        return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
      } else {
        const suspendedCreate: ISuspensionInstance | null = await ClassSuspensionService.showFilter({
          driverId: vData.driverId,
          end: pReq.input('driverSuspendedTo', 'string')
        })
        if (suspendedCreate) {
          vData.id = suspendedCreate?.dataValues.id
          vData.isCanceled = true
          await ClassSuspensionService.update(vData)
        }
      }
      return pRes.status(200).send(fxSuccessResponse(200, null, 'Correcto'))
    } catch (error) {
      console.log('error :>> ', error)
      pNext(error)
    }
  }

  async CancelSuspended(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ISuspensionInput = pReq.only([
        'id',
        'driverId',
        'reason',
        'timeFrame',
        'init',
        'end',
        'isCanceled',
      ])

      const suspension = await ClassSuspensionService.show(vData.id)
      if (!suspension) {
        return pRes
          .status(400)
          .send(fxErrorResponse(400, { user: null, token: null }, 'La suspension no existe'))
      }
      suspension.end = new Date()
      suspension.isCanceled = true
      const vResponse: ISuspensionInstance | null = await ClassSuspensionService.update(suspension)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }

      return pRes
        .status(200)
        .send(fxSuccessResponse(200, vResponse, 'Suspensión cancelada con éxito'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassSuspensionService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new SuspensionController()
