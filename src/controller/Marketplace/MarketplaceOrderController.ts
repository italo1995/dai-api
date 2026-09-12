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
      const vData = pReq.only([
        'deliveryLat',
        'deliveryLon',
        'deliveryAddress',
        'vehicle',
        'paymentMethodId',
        'referencePointText',
        'referencePhoto',
      ])
      const vResponse = await ClassMarketplaceOrderService.createFromCart(vAuth.id, {
        deliveryLat: Number(vData.deliveryLat),
        deliveryLon: Number(vData.deliveryLon),
        deliveryAddress: vData.deliveryAddress ?? null,
        vehicle: vData.vehicle,
        paymentMethodId: Number(vData.paymentMethodId),
        referencePointText: vData.referencePointText ?? null,
        referencePhoto: vData.referencePhoto ?? null,
      })
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

  // [Orden 7/8] El comercio cancela el pedido (el cliente no puede).
  async cancel(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData = pReq.only(['orderId', 'reason'])
      const vResponse = await ClassMarketplaceOrderService.cancel(vAuth.id, vAuth.rolId, {
        orderId: Number(vData.orderId),
        reason: vData.reason ?? null,
      })
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Pedido cancelado'))
    } catch (error) {
      if (error instanceof MarketplaceOrderError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }

  // El CLIENTE cancela (si el pedido todavia no lo confirmo la tienda) o solicita cancelar (si ya
  // lo confirmo) su propio pedido. El service decide cual de los dos segun el status actual.
  async cancelByClient(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData = pReq.only(['orderId', 'reason'])
      const vResponse = await ClassMarketplaceOrderService.cancelByClient(vAuth.id, {
        orderId: Number(vData.orderId),
        reason: vData.reason ?? null,
      })
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      if (error instanceof MarketplaceOrderError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }

  // La tienda (o admin/operador) acepta la solicitud de cancelacion del cliente.
  async acceptCancelRequest(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData = pReq.only(['orderId'])
      const vResponse = await ClassMarketplaceOrderService.acceptCancelRequest(vAuth.id, vAuth.rolId, {
        orderId: Number(vData.orderId),
      })
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Solicitud aceptada'))
    } catch (error) {
      if (error instanceof MarketplaceOrderError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }

  // La tienda (o admin/operador) rechaza la solicitud de cancelacion del cliente.
  async rejectCancelRequest(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData = pReq.only(['orderId'])
      const vResponse = await ClassMarketplaceOrderService.rejectCancelRequest(vAuth.id, vAuth.rolId, {
        orderId: Number(vData.orderId),
      })
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Solicitud rechazada'))
    } catch (error) {
      if (error instanceof MarketplaceOrderError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }

  // [Orden 8/8] Detalle de un pedido (con scoping por rol).
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId = Number(pReq.query.id)
      if (!vId) {
        return pRes.status(400).send(fxErrorResponse(400, null, 'id es requerido'))
      }
      const vResponse = await ClassMarketplaceOrderService.showScoped(vId, {
        id: vAuth.id,
        rolId: vAuth.rolId,
        typeUser: vAuth.typeUser,
      })
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      if (error instanceof MarketplaceOrderError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }

  // [Orden 8/8] Listado paginado, con la vista que corresponde a quien pregunta.
  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vResponse = await ClassMarketplaceOrderService.list(pReq.query, {
        id: vAuth.id,
        rolId: vAuth.rolId,
        typeUser: vAuth.typeUser,
      })
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      if (error instanceof MarketplaceOrderError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }
}

export default new MarketplaceOrderController()
