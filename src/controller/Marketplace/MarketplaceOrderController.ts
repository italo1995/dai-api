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
  // Cotiza el delivery del carrito actual (distancia real via Google + tarifa por zona) y
  // devuelve el resumen a mostrar mas un quoteToken firmado - no crea nada todavia.
  async quote(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData = pReq.only(['deliveryLat', 'deliveryLon', 'vehicle'])
      const vResponse = await ClassMarketplaceOrderService.getQuote(vAuth.id, {
        deliveryLat: Number(vData.deliveryLat),
        deliveryLon: Number(vData.deliveryLon),
        vehicle: vData.vehicle,
      })
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      if (error instanceof MarketplaceOrderError) {
        return pRes.status(error.code).send(fxErrorResponse(error.code, null, error.message))
      }
      pNext(error)
    }
  }

  // QA Sprint 3 #2/#6: la app manda la suma de volumen del carrito, devolvemos si entra en moto.
  async checkVolume(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vVolume = Number(pReq.input('volume'))
      if (!Number.isFinite(vVolume) || vVolume < 0) {
        return pRes.status(400).send(fxErrorResponse(400, null, 'volume debe ser un numero valido'))
      }
      const vResponse = await ClassMarketplaceOrderService.checkVolume(vVolume)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData = pReq.only([
        'quoteToken',
        'deliveryAddress',
        'paymentMethodId',
        'referencePointText',
        'referencePhoto',
      ])
      const vResponse = await ClassMarketplaceOrderService.createFromCart(vAuth.id, {
        quoteToken: vData.quoteToken,
        deliveryAddress: vData.deliveryAddress ?? null,
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

  // La tienda marca el pedido como listo ANTES de que se cumpla prepTimeMinutes (Italo,
  // 2026-09-18) - fuerza el despacho ya mismo si todavia no arranco, o avisa al conductor
  // asignado si ya esta en camino.
  async markReady(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData = pReq.only(['orderId'])
      const vResponse = await ClassMarketplaceOrderService.markReady(vAuth.id, vAuth.rolId, {
        orderId: Number(vData.orderId),
      })
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Pedido marcado como listo'))
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

  // El repartidor consulta si hay algun pedido buscando conductor cerca de su ubicacion actual -
  // respaldo "pull" para cuando el aviso por socket ("newMarketplaceOrder") no le llega.
  async nearbyPending(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vResponse = await ClassMarketplaceOrderService.nearbyPending(vAuth.id, {
        lat: Number(pReq.query.lat),
        lon: Number(pReq.query.lon),
        distance: pReq.query.distance ? Number(pReq.query.distance) : undefined,
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
