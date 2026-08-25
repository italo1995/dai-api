import type { NextFunction, Request, Response } from 'express'
import ClassCouponService from '../../services/Coupon/CouponService'
import type { ICouponInput, IResponseAllCoupon } from '../../types/Coupon'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { ICouponInstance } from '../../models/Coupon/CouponModel'

class CouponController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)
      const vResponse: ICouponInstance | null = await ClassCouponService.show(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAllCoupon | ICouponInstance[] = await ClassCouponService.all(vParam)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ICouponInput = pReq.only([
        'code',
        'type',
        'value',
        'minOrderAmount',
        'maxDiscount',
        'usageLimit',
        'expiresAt',
        'isActive',
      ])
      if (!vData.code || !vData.type || vData.value === undefined) {
        return pRes.status(400).send(fxErrorResponse(400, null, 'code, type y value son requeridos'))
      }
      const vResponse: ICouponInstance = await ClassCouponService.create(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error: any) {
      if (error?.name === 'SequelizeUniqueConstraintError') {
        return pRes.status(400).send(fxErrorResponse(400, null, 'Ya existe un cupon con ese codigo'))
      }
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ICouponInput = pReq.only([
        'id',
        'code',
        'type',
        'value',
        'minOrderAmount',
        'maxDiscount',
        'usageLimit',
        'expiresAt',
        'isActive',
      ])
      const vResponse: ICouponInstance | null = await ClassCouponService.update(vData)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error: any) {
      if (error?.name === 'SequelizeUniqueConstraintError') {
        return pRes.status(400).send(fxErrorResponse(400, null, 'Ya existe un cupon con ese codigo'))
      }
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassCouponService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new CouponController()
