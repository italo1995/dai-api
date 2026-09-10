/*
- File: MarketplaceOrderController.ts
- Purpose: [Orden 2/8] Endpoint para que el cliente convierta su carrito en un pedido. El userId
  sale del JWT (req.auth), nunca por parametro.
*/
import type { NextFunction, Request, Response } from 'express'
import ClassMarketplaceOrderService, {
  MarketplaceOrderError,
} from '../../services/Marketplace/MarketplaceOrderService'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'

class MarketplaceOrderController {
  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vResponse = await ClassMarketplaceOrderService.createFromCart(vAuth.id)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Pedido creado'))
    } catch (error) {
      if (error instanceof MarketplaceOrderError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }

  // [Orden 3/8] El comercio confirma el pedido y fija el tiempo de preparacion.
  async confirm(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData = pReq.only(['orderId', 'prepTimeMinutes'])
      const vResponse = await ClassMarketplaceOrderService.confirm(vAuth.id, vAuth.rolId, {
        orderId: Number(vData.orderId),
        prepTimeMinutes: Number(vData.prepTimeMinutes),
      })
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Pedido confirmado'))
    } catch (error) {
      if (error instanceof MarketplaceOrderError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }
}

export default new MarketplaceOrderController()
