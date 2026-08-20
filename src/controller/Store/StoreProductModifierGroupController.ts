/*
- File: StoreProductModifierGroupController.ts

- Purpose: Grupos de modificadores de un producto. El rol 'store' (rolId=4) solo puede
  crear/editar/borrar grupos de productos de sus propias tiendas; admin y operator pueden operar
  sobre cualquiera. Como el grupo no tiene storeId directo (cuelga de un producto), la
  verificacion de dueño resuelve primero el producto para sacar su storeId.

==========Functions Manifest==========
Para todos los casos, si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1 - show: trae un grupo por id, con sus opciones
2 - all: lista publica de los grupos (con opciones) de un producto (?productId=X)
3 - allAdmin: lista paginada/buscable para el panel
4 - create: crea un grupo. El dueño solo puede crearlo en un producto de una tienda propia
5 - update: actualiza un grupo (y reemplaza sus opciones si vienen)
6 - destroy: elimina (soft delete) un grupo propio o, si es admin/operator, cualquiera
*/
import type { NextFunction, Request, Response } from 'express'
import ClassStoreProductModifierGroupService from '../../services/Store/StoreProductModifierGroupService'
import ClassStoreProductService from '../../services/Store/StoreProductService'
import type { IStoreProductModifierGroupInput } from '../../types/StoreProductModifierGroup'
import { fxSuccessResponse, fxErrorResponse, fxCanManageStore } from '../../utils/helpers'
import type { IStoreProductModifierGroupInstance } from '../../models/Store/StoreProductModifierGroupModel'
import type { IStoreProductInstance } from '../../models/Store/StoreProductModel'

// Standalone (no metodo de instancia): Express llama a controller.create/update/destroy como
// funciones sueltas (router.route().post(controller.create)), asi que 'this' no esta enlazado
// dentro de esos metodos - un helper de instancia (fxCanManageProduct) explota con
// "Cannot read properties of undefined". Mismo patron que fxCanManageStore en utils/helpers.ts.
async function fxCanManageProduct(pAuth: any, pProductId: number): Promise<boolean> {
  const vProduct: IStoreProductInstance | null = await ClassStoreProductService.show(pProductId)
  if (!vProduct) {
    return false
  }
  return fxCanManageStore(pAuth, vProduct.dataValues.storeId)
}

class StoreProductModifierGroupController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)
      const vResponse: IStoreProductModifierGroupInstance | null = await ClassStoreProductModifierGroupService.show(
        vId
      )
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
      const vProductId: number = Number(pReq.query.productId)
      if (!vProductId) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'productId es requerido'))
      }
      const vResponse: IStoreProductModifierGroupInstance[] = await ClassStoreProductModifierGroupService.all(
        vProductId
      )
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async allAdmin(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse = await ClassStoreProductModifierGroupService.allAdmin(vParam)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData: IStoreProductModifierGroupInput = pReq.only([
        'productId',
        'name',
        'required',
        'minSelections',
        'maxSelections',
        'modifiers',
      ])
      const vProductId = Number(vData.productId)
      if (!vProductId || !(await fxCanManageProduct(vAuth, vProductId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      const vResponse: IStoreProductModifierGroupInstance = await ClassStoreProductModifierGroupService.create(
        vData
      )
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId: number = Number(pReq.input('id', 'number'))
      const vExisting: IStoreProductModifierGroupInstance | null = await ClassStoreProductModifierGroupService.show(
        vId
      )
      if (!vExisting) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (!(await fxCanManageProduct(vAuth, vExisting.dataValues.productId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      // productId no se toca desde update - un grupo no cambia de producto.
      const vData: IStoreProductModifierGroupInput = pReq.only([
        'id',
        'name',
        'required',
        'minSelections',
        'maxSelections',
        'modifiers',
      ])
      const vResponse: IStoreProductModifierGroupInstance | null = await ClassStoreProductModifierGroupService.update(
        vData
      )
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId: number = pReq.input('id', 'number')
      const vExisting: IStoreProductModifierGroupInstance | null = await ClassStoreProductModifierGroupService.show(
        vId
      )
      if (!vExisting) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      if (!(await fxCanManageProduct(vAuth, vExisting.dataValues.productId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      const vResponse: boolean = await ClassStoreProductModifierGroupService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new StoreProductModifierGroupController()
