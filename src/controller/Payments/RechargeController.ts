import type { NextFunction, Request, Response } from 'express'
import rechargeService from '../../services/Payments/RechargeService'
import {
  type IRechargeAttributes,
  type rechargeReponseAll,
  type rechargeInstance,
  EStatusRecharge,
  ETypeRecharge,
} from '../../models/payments/RechargeModel'
import { fxSuccessResponse, fxErrorResponse, moveImages, fxTwilioSendCodeRecharge } from '../../utils/helpers'
import ClassUserService from '../../services/User/UserService'
import CurrencyService from '../../services/Payments/CurrencyService'

export const recharge = {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: rechargeInstance | null = await rechargeService.show(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      if (pReq.auth.rolId === 3) {
        vParam.userId = pReq.auth.id
      }
      const vResponse: rechargeReponseAll | rechargeInstance[] = await rechargeService.all(vParam)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const user = pReq.auth
      const vData: IRechargeAttributes = pReq.only([
        'amount',
        'countryId',
        'currencyId',
        'bankId',
        'bank',
        'capture',
        'reference',
        'type',
      ])
      if (!vData?.currencyId) {
        const currency = await CurrencyService.principal()
        vData.currencyId = Number(currency?.dataValues.id)
      }
      if (user.rolId === 3) {
        vData.userId = pReq.auth.id
        vData.status = EStatusRecharge.PENDING
      } else {
        vData.adminId = pReq.auth.id
        vData.userId = pReq.input('userId')
        if (Number(vData.type) === ETypeRecharge.withDraw && vData.userId) {
          const user = await ClassUserService.show({ id: vData.userId })
          if (!user?.dataValues.balance || user?.dataValues.balance < Number(vData.amount)) {
            return pRes
              .status(500)
              .send(fxErrorResponse(500, null, 'Monto insuficiente'))
          }
          const vPhoneNumberSend: string = `${user?.dataValues.phoneCode}${user?.dataValues.phoneNumber}`
          const code = await fxTwilioSendCodeRecharge(vPhoneNumberSend, null, null)
          vData.code = code
          vData.status = EStatusRecharge.PENDING
        } else {
          vData.status = EStatusRecharge.APPROVED
        }
      }
      if (vData?.capture) {
        vData.capture = await moveImages(vData.capture)
      }

      const vResponse: rechargeInstance | null = await rechargeService.create(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (user.rolId !== 3) {
        const currencyId = vResponse?.dataValues?.currencyId || await CurrencyService.principal()
        if (Number(vData.type) === ETypeRecharge.recharge && vData.userId) {
          const amount: number = await CurrencyService.convert({ currencyId: Number(currencyId), amount: Number(vResponse?.dataValues.amount) })
          await ClassUserService.sumBalance({
            id: vData.userId,
            balance: amount
          })
          // const vUser = await ClassUserService.show({ id: vData.userId })
          // if (vUser?.dataValues.socketId) {
          //   SocketService.io.to(vUser?.dataValues.socketId).emit('recharge', vData)
          // }
        }
      } 
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      console.log('error :>> ', error)
      pNext(error)
    }
  },

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IRechargeAttributes = pReq.only([
        'id',
        'status'
      ])
      vData.adminId = pReq.auth.id
      if (!vData?.id) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      const oldRecharge: rechargeInstance | null = await rechargeService.show(Number(vData.id))
      const oldRechargeJSON: rechargeInstance = JSON.parse(JSON.stringify(oldRecharge))
      if (oldRechargeJSON.status === EStatusRecharge.APPROVED) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'No se puede actualizar luego de ser aprobada'))
      }
      const vResponse: rechargeInstance | null = await rechargeService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (Number(vData.status) === EStatusRecharge.APPROVED && oldRechargeJSON.status === EStatusRecharge.PENDING) {
        const currencyId = vResponse?.dataValues?.currencyId
        const amount: number = await CurrencyService.convert({ currencyId: Number(currencyId), amount: Number(vResponse?.dataValues.amount) })
        if (oldRecharge?.dataValues.userId) {
          await ClassUserService.sumBalance({
            id: oldRecharge?.dataValues.userId,
            balance: amount
          })
        }
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      console.log('error :>> ', error)
      pNext(error)
    }
  },

  async verify(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IRechargeAttributes = pReq.only([
        'id',
        'code'
      ])
      vData.status = EStatusRecharge.APPROVED
      vData.adminId = pReq.auth.id
      if (!vData?.id || !vData?.code) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'El id y el codigo son requeridos'))
      }
      const oldRecharge: rechargeInstance | null = await rechargeService.show(Number(vData.id))
      const oldRechargeJSON: rechargeInstance = JSON.parse(JSON.stringify(oldRecharge))
      if (oldRechargeJSON.status === EStatusRecharge.APPROVED) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'No se puede actualizar luego de ser aprobada'))
      }
      if (vData.code !== oldRechargeJSON.code || !oldRechargeJSON?.userId) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'El codigo es incorrecto'))
      }
      if (oldRechargeJSON.userId) {
        const user = await ClassUserService.show({ id: oldRechargeJSON.userId })
        if (!user?.dataValues.balance || Number(user?.dataValues.balance) < Number(oldRechargeJSON.amount)) {
          return pRes
            .status(500)
            .send(fxErrorResponse(500, null, 'Monto insuficiente'))
        }
      }
      const vResponse: rechargeInstance | null = await rechargeService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (Number(vData.status) === EStatusRecharge.APPROVED && oldRechargeJSON.status === EStatusRecharge.PENDING) {
        const currencyId = vResponse?.dataValues?.currencyId
        const amount: number = await CurrencyService.convert({ currencyId: Number(currencyId), amount: Number(vResponse?.dataValues.amount) })
        if (oldRechargeJSON.type === ETypeRecharge.recharge) {
          if (oldRecharge?.dataValues.userId) {
            await ClassUserService.sumBalance({
              id: oldRecharge?.dataValues.userId,
              balance: amount
            })
          }
        } else {
          if (oldRecharge?.dataValues.userId) {
            await ClassUserService.sumBalance({
              id: oldRecharge?.dataValues.userId,
              discount: amount
            })
          }
        }
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      console.log('error :>> ', error)
      pNext(error)
    }
  },

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = pReq.input('id', 'string')
      const vResponse: boolean = await rechargeService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  },
}
