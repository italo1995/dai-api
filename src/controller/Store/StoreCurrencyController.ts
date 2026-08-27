/*
- File: StoreCurrencyController.ts

- Purpose: Controlador de monedas aceptadas por una tienda. El rol 'store' (rolId=4) solo puede
  administrar las de sus propias tiendas; admin y operator pueden operar sobre cualquiera.
  Lectura (show/all) es publica, no hay datos sensibles.
*/
import type { NextFunction, Request, Response } from 'express'
import ClassStoreCurrencyService from '../../services/Store/StoreCurrencyService'
import type { IStoreCurrencyInput } from '../../types/StoreCurrency'
import { fxSuccessResponse, fxErrorResponse, fxCanManageStore } from '../../utils/helpers'
import type { IStoreCurrencyInstance } from '../../models/Store/StoreCurrencyModel'

class StoreCurrencyController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)
      const vResponse: IStoreCurrencyInstance | null = await ClassStoreCurrencyService.show(vId)
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
      const vStoreId: number = Number(pReq.query.storeId)
      if (!vStoreId) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'storeId es requerido'))
      }
      const vResponse: IStoreCurrencyInstance[] = await ClassStoreCurrencyService.all(vStoreId)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async allAdmin(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse = await ClassStoreCurrencyService.allAdmin(vParam)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData: IStoreCurrencyInput = pReq.only(['storeId', 'currencyId', 'exchangeRate', 'isDefault'])
      const vStoreId = Number(vData.storeId)
      if (!vStoreId || !(await fxCanManageStore(vAuth, vStoreId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      const vResponse: IStoreCurrencyInstance = await ClassStoreCurrencyService.create(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error: any) {
      if (error?.name === 'SequelizeUniqueConstraintError') {
        return pRes.status(400).send(fxErrorResponse(400, null, 'Esta tienda ya tiene esa moneda agregada'))
      }
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId: number = Number(pReq.input('id', 'number'))
      const vExisting: IStoreCurrencyInstance | null = await ClassStoreCurrencyService.show(vId)
      if (!vExisting) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (!(await fxCanManageStore(vAuth, vExisting.dataValues.storeId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      // storeId/currencyId no se tocan desde update - para cambiar la moneda hay que borrar y
      // agregar una nueva, asi el unique parcial (store_id, currency_id) sigue siendo confiable.
      const vData: IStoreCurrencyInput = pReq.only(['id', 'exchangeRate', 'isDefault'])
      const vResponse: IStoreCurrencyInstance | null = await ClassStoreCurrencyService.update(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId: number = pReq.input('id', 'number')
      const vExisting: IStoreCurrencyInstance | null = await ClassStoreCurrencyService.show(vId)
      if (!vExisting) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      if (!(await fxCanManageStore(vAuth, vExisting.dataValues.storeId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      const vResponse: boolean = await ClassStoreCurrencyService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new StoreCurrencyController()
