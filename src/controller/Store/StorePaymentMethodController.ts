/*
- File: StorePaymentMethodController.ts

- Purpose: Controlador de metodos de pago de una tienda. El rol 'store' (rolId=4) solo puede
  administrar los de sus propias tiendas; admin y operator pueden operar sobre cualquiera.
  Lectura (show/all) es publica, no hay datos sensibles.
*/
import type { NextFunction, Request, Response } from 'express'
import ClassStorePaymentMethodService from '../../services/Store/StorePaymentMethodService'
import type { IStorePaymentMethodInput } from '../../types/StorePaymentMethod'
import { fxSuccessResponse, fxErrorResponse, fxCanManageStore, moveImages } from '../../utils/helpers'
import type { IStorePaymentMethodInstance } from '../../models/Store/StorePaymentMethodModel'

class StorePaymentMethodController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)
      const vResponse: IStorePaymentMethodInstance | null = await ClassStorePaymentMethodService.show(vId)
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
      const vResponse: IStorePaymentMethodInstance[] = await ClassStorePaymentMethodService.all(vStoreId)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async allAdmin(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse = await ClassStorePaymentMethodService.allAdmin(vParam)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData: IStorePaymentMethodInput = pReq.only([
        'storeId',
        'type',
        'label',
        'currencyId',
        'iconId',
        'customIcon',
        'isActive',
      ])
      const vStoreId = Number(vData.storeId)
      if (!vStoreId || !(await fxCanManageStore(vAuth, vStoreId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      if (vData?.customIcon && vData.customIcon.includes('temp')) {
        vData.customIcon = await moveImages(vData.customIcon)
      }
      const vResponse: IStorePaymentMethodInstance = await ClassStorePaymentMethodService.create(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId: number = Number(pReq.input('id', 'number'))
      const vExisting: IStorePaymentMethodInstance | null = await ClassStorePaymentMethodService.show(vId)
      if (!vExisting) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (!(await fxCanManageStore(vAuth, vExisting.dataValues.storeId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      // storeId no se toca desde update - un metodo de pago no cambia de tienda.
      const vData: IStorePaymentMethodInput = pReq.only([
        'id',
        'type',
        'label',
        'currencyId',
        'iconId',
        'customIcon',
        'isActive',
      ])
      if (vData?.customIcon && vData.customIcon.includes('temp')) {
        vData.customIcon = await moveImages(vData.customIcon)
      }
      const vResponse: IStorePaymentMethodInstance | null = await ClassStorePaymentMethodService.update(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId: number = pReq.input('id', 'number')
      const vExisting: IStorePaymentMethodInstance | null = await ClassStorePaymentMethodService.show(vId)
      if (!vExisting) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      if (!(await fxCanManageStore(vAuth, vExisting.dataValues.storeId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      const vResponse: boolean = await ClassStorePaymentMethodService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new StorePaymentMethodController()
