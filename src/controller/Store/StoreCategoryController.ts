/*
- File: StoreCategoryController.ts

- Purpose: Controlador de categorias de una tienda. El rol 'store' (rolId=4) solo puede
  crear/editar/borrar categorias de sus propias tiendas; admin y operator pueden operar sobre
  cualquiera. Lectura (show/all) es publica, no hay datos sensibles en {id, storeId, name}.

==========Functions Manifest==========
Para todos los casos, si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1 - show: trae una categoria por id
2 - all: lista las categorias de una tienda (?storeId=X)
3 - create: crea una categoria. El dueño solo puede crearla en una tienda propia
4 - update: actualiza el nombre de una categoria propia (o cualquiera, si es admin/operator)
5 - destroy: elimina (soft delete) una categoria propia o, si es admin/operator, cualquiera
*/
import type { NextFunction, Request, Response } from 'express'
import ClassStoreCategoryService from '../../services/Store/StoreCategoryService'
import type { IStoreCategoryInput } from '../../types/StoreCategory'
import { fxSuccessResponse, fxErrorResponse, fxCanManageStore } from '../../utils/helpers'
import type { IStoreCategoryInstance } from '../../models/Store/StoreCategoryModel'

class StoreCategoryController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)
      const vResponse: IStoreCategoryInstance | null = await ClassStoreCategoryService.show(vId)
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
      const vResponse: IStoreCategoryInstance[] = await ClassStoreCategoryService.all(vStoreId)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async allAdmin(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse = await ClassStoreCategoryService.allAdmin(vParam)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData: IStoreCategoryInput = pReq.only(['storeId', 'name'])
      const vStoreId = Number(vData.storeId)
      if (!vStoreId || !(await fxCanManageStore(vAuth, vStoreId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      const vResponse: IStoreCategoryInstance = await ClassStoreCategoryService.create(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId: number = Number(pReq.input('id', 'number'))
      const vExisting: IStoreCategoryInstance | null = await ClassStoreCategoryService.show(vId)
      if (!vExisting) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (!(await fxCanManageStore(vAuth, vExisting.dataValues.storeId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      // storeId no se toca desde update - una categoria no cambia de tienda.
      const vData: IStoreCategoryInput = pReq.only(['id', 'name'])
      const vResponse: IStoreCategoryInstance | null = await ClassStoreCategoryService.update(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId: number = pReq.input('id', 'number')
      const vExisting: IStoreCategoryInstance | null = await ClassStoreCategoryService.show(vId)
      if (!vExisting) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      if (!(await fxCanManageStore(vAuth, vExisting.dataValues.storeId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      const vResponse: boolean = await ClassStoreCategoryService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new StoreCategoryController()
