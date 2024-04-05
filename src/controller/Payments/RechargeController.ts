import type { NextFunction, Request, Response } from 'express'
import rechargeService from '../../services/Payments/RechargeService'
import type {
  rechargeAttributes,
  rechargeReponseAll,
  rechargeInstance,
} from '../../models/payments/RechargeModel'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'

export const recharge = {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = String(pReq.query.id)

      const vResponse: rechargeInstance | null = await rechargeService.show(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: rechargeReponseAll | rechargeInstance[] = await rechargeService.all(vParam)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
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
        'adminId',
        'status',
      ])

      const vResponse: rechargeInstance | null = await rechargeService.create(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: rechargeAttributes = pReq.only([
        'id',
        'amount',
        'countryId',
        'currencyId',
        'bankId',
        'bank',
        'capture',
        'reference',
        'adminId',
        'status',
      ])

      const vResponse: rechargeInstance | null = await rechargeService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
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
