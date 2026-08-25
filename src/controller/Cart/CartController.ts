/*
- File: CartController.ts
- Purpose: Carrito de compra del usuario logueado. El userId siempre sale del JWT (req.auth), no
  se recibe por parametro - cada quien solo puede ver/tocar su propio carrito.
*/
import type { NextFunction, Request, Response } from 'express'
import ClassCartService, { CartError } from '../../services/Cart/CartService'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { IAddCartItemInput, IApplyCouponInput, IUpdateCartItemInput } from '../../types/Cart'

class CartController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vResponse = await ClassCartService.show(vAuth.id)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      if (error instanceof CartError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }

  async addItem(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData: IAddCartItemInput = pReq.only([
        'productId',
        'quantity',
        'modifiers',
        'notes',
        'replaceStore',
      ])
      if (!vData.productId) {
        return pRes.status(400).send(fxErrorResponse(400, null, 'productId es requerido'))
      }
      const vResponse = await ClassCartService.addItem(vAuth.id, vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      if (error instanceof CartError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }

  async updateItem(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData: IUpdateCartItemInput = pReq.only(['cartItemId', 'quantity', 'modifiers'])
      if (!vData.cartItemId) {
        return pRes.status(400).send(fxErrorResponse(400, null, 'cartItemId es requerido'))
      }
      const vResponse = await ClassCartService.updateItem(vAuth.id, vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      if (error instanceof CartError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }

  async removeItem(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vCartItemId = Number(pReq.input('cartItemId', 'number'))
      if (!vCartItemId) {
        return pRes.status(400).send(fxErrorResponse(400, null, 'cartItemId es requerido'))
      }
      const vResponse = await ClassCartService.removeItem(vAuth.id, vCartItemId)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      if (error instanceof CartError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }

  async clear(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vResponse = await ClassCartService.clear(vAuth.id)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      if (error instanceof CartError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }

  async applyCoupon(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData: IApplyCouponInput = pReq.only(['code'])
      if (!vData.code) {
        return pRes.status(400).send(fxErrorResponse(400, null, 'code es requerido'))
      }
      const vResponse = await ClassCartService.applyCoupon(vAuth.id, vData.code)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      if (error instanceof CartError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }

  async removeCoupon(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vResponse = await ClassCartService.removeCoupon(vAuth.id)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      if (error instanceof CartError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }
}

export default new CartController()
