import type { NextFunction, Request, Response } from 'express'
import rechargeService from '../../services/Payments/RechargeService'
import {
  type rechargeAttributes,
  type rechargeReponseAll,
  type rechargeInstance,
  EStatusRecharge,
} from '../../models/payments/RechargeModel'
import { fxSuccessResponse, fxErrorResponse, moveImages } from '../../utils/helpers'
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
      const vData: rechargeAttributes = pReq.only([
        'amount',
        'countryId',
        'currencyId',
        'bankId',
        'bank',
        'capture',
        'reference',
        // 'adminId',
        // 'status',
      ])
      vData.userId = pReq.auth.id
      if (vData?.capture) {
        vData.capture = await moveImages(vData.capture)
      }
      vData.status = EStatusRecharge.pending
      const vResponse: rechargeInstance | null = await rechargeService.create(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      console.log('error :>> ', error)
      pNext(error)
    }
  },

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: rechargeAttributes = pReq.only([
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
      const vResponse: rechargeInstance | null = await rechargeService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      console.log('vData.status :>> ', vData.status)
      console.log('EStatusRecharge.approved :>> ', EStatusRecharge.approved)
      console.log('oldRechargeJSON.status :>> ', oldRechargeJSON.status)
      if (Number(vData.status) === EStatusRecharge.approved && oldRechargeJSON.status !== EStatusRecharge.approved) {
        console.log('deberia recargar')
        const currencyId = vResponse?.dataValues?.currencyId
        console.log('currencyId :>> ', currencyId)
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
