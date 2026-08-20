/*
- File: StoreFavoriteController.ts

- Purpose: Tiendas favoritas del usuario logueado. Las 3 acciones exigen estar autenticado -
  "favoritos" siempre es sobre el usuario del token, nunca se recibe un userId por body/query.

==========Functions Manifest==========
Para todos los casos, si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1 - add: agrega una tienda a mis favoritos (idempotente)
2 - remove: quita una tienda de mis favoritos
3 - all: lista paginada de mis tiendas favoritas
*/
import type { NextFunction, Request, Response } from 'express'
import ClassStoreFavoriteService from '../../services/Store/StoreFavoriteService'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'

class StoreFavoriteController {
  async add(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vStoreId: number = pReq.input('storeId', 'number')
      if (!vStoreId) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'storeId es requerido'))
      }
      await ClassStoreFavoriteService.add({ userId: vAuth.id, storeId: vStoreId })
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async remove(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vStoreId: number = pReq.input('storeId', 'number')
      if (!vStoreId) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'storeId es requerido'))
      }
      await ClassStoreFavoriteService.remove({ userId: vAuth.id, storeId: vStoreId })
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vParam: any = pReq.query
      const vResponse = await ClassStoreFavoriteService.all(vAuth.id, vParam)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new StoreFavoriteController()
