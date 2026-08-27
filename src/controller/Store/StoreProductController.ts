/*
- File: StoreProductController.ts

- Purpose: Catalogo de productos de una tienda del Marketplace. El rol 'store' (rolId=4) solo
  puede ver/crear/editar/borrar productos de sus propias tiendas; admin y operator pueden
  operar sobre cualquiera.

==========Functions Manifest==========
Para todos los casos, si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1 - show: trae un producto por id
2 - all: endpoint publico para la app/cliente, filtrado por storeId (?storeId=X), solo
    productos disponibles de tiendas aprobadas
3 - allAdmin: panel (dueño ve solo los suyos, admin/operator ve todos, filtrable por storeId)
4 - create: crea un producto. El dueño solo puede crearlo en una tienda propia
5 - update: actualiza un producto. El dueño solo puede editar productos de sus propias tiendas
6 - destroy: elimina (soft delete) un producto propio o, si es admin/operator, cualquiera
 */
import type { NextFunction, Request, Response } from 'express'
import ClassStoreProductService, { fxToPublicStoreProduct } from '../../services/Store/StoreProductService'
import ClassStoreService from '../../services/Store/StoreService'
import type { IStoreProductInput, IResponseAllStoreProduct } from '../../types/StoreProduct'
import { fxSuccessResponse, fxErrorResponse, moveImages, fxIsStoreRole, fxCanManageStore } from '../../utils/helpers'
import type { IStoreProductInstance } from '../../models/Store/StoreProductModel'
import type { IStoreInstance } from '../../models/Store/StoreModel'

class StoreProductController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)
      const vResponse: IStoreProductInstance | null = await ClassStoreProductService.show(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      const vAuth: any = (pReq as any).auth
      const vIsPrivileged = await fxCanManageStore(vAuth, vResponse.dataValues.storeId)
      if (!vIsPrivileged) {
        const vStore: IStoreInstance | null = await ClassStoreService.show(vResponse.dataValues.storeId)
        if (!vResponse.dataValues.isAvailable || !vStore?.dataValues.isApproved) {
          return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
        }
      }
      const vData = vIsPrivileged ? vResponse : fxToPublicStoreProduct(vResponse)
      return pRes.status(200).send(fxSuccessResponse(200, vData, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      if (!Number(vParam?.storeId)) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'storeId es requerido'))
      }
      const vResponse = await ClassStoreProductService.all(vParam)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async allAdmin(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vParam: any = pReq.query
      const vOwnerId: string | undefined = fxIsStoreRole(vAuth) ? vAuth.id : undefined
      const vResponse: IResponseAllStoreProduct | IStoreProductInstance[] =
        await ClassStoreProductService.allAdmin(vParam, vOwnerId)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData: IStoreProductInput = pReq.only([
        'storeId',
        'name',
        'description',
        'price',
        'promoPrice',
        'promoEndsAt',
        'currencyId',
        'image',
        'departmentId',
        'categoryIds',
        'images',
        'isAvailable',
        'isInventoryable',
        'stockQuantity',
      ])
      const vStoreId = Number(vData.storeId)
      if (!vStoreId || !(await fxCanManageStore(vAuth, vStoreId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      if (vData?.image && vData.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      if (vData?.images?.length) {
        vData.images = await Promise.all(vData.images.map((pImage) => moveImages(pImage)))
      }
      const vResponse: IStoreProductInstance = await ClassStoreProductService.create(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      console.log('error :>> ', error)
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId: number = Number(pReq.input('id', 'number'))
      const vExisting: IStoreProductInstance | null = await ClassStoreProductService.show(vId)
      if (!vExisting) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (!(await fxCanManageStore(vAuth, vExisting.dataValues.storeId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      const vData: IStoreProductInput = pReq.only([
        'id',
        'name',
        'description',
        'price',
        'promoPrice',
        'promoEndsAt',
        'currencyId',
        'image',
        'departmentId',
        'categoryIds',
        'images',
        'isAvailable',
        'isInventoryable',
        'stockQuantity',
      ])
      if (vData?.image && vData.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      if (vData?.images?.length) {
        vData.images = await Promise.all(vData.images.map((pImage) => moveImages(pImage)))
      }
      const vResponse: IStoreProductInstance | null = await ClassStoreProductService.update(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId: number = pReq.input('id', 'number')
      const vExisting: IStoreProductInstance | null = await ClassStoreProductService.show(vId)
      if (!vExisting) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      if (!(await fxCanManageStore(vAuth, vExisting.dataValues.storeId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      const vResponse: boolean = await ClassStoreProductService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new StoreProductController()
