/*
- File: StoreDepartmentController.ts

- Purpose: Controlador de departamentos de una tienda. El rol 'store' (rolId=4) solo puede
  crear/editar/borrar departamentos de sus propias tiendas; admin y operator pueden operar sobre
  cualquiera. Lectura (show/all) es publica, no hay datos sensibles en {id, storeId, name}.

==========Functions Manifest==========
Para todos los casos, si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1 - show: trae un departamento por id
2 - all: lista los departamentos de una tienda (?storeId=X)
3 - create: crea un departamento. El dueño solo puede crearlo en una tienda propia
4 - update: actualiza el nombre de un departamento propio (o cualquiera, si es admin/operator)
5 - destroy: elimina (soft delete) un departamento propio o, si es admin/operator, cualquiera
*/
import type { NextFunction, Request, Response } from 'express'
import ClassStoreDepartmentService from '../../services/Store/StoreDepartmentService'
import type { IStoreDepartmentInput } from '../../types/StoreDepartment'
import { fxSuccessResponse, fxErrorResponse, fxCanManageStore } from '../../utils/helpers'
import type { IStoreDepartmentInstance } from '../../models/Store/StoreDepartmentModel'

class StoreDepartmentController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)
      const vResponse: IStoreDepartmentInstance | null = await ClassStoreDepartmentService.show(vId)
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
      const vResponse: IStoreDepartmentInstance[] = await ClassStoreDepartmentService.all(vStoreId)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async allAdmin(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse = await ClassStoreDepartmentService.allAdmin(vParam)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData: IStoreDepartmentInput = pReq.only(['storeId', 'name'])
      const vStoreId = Number(vData.storeId)
      if (!vStoreId || !(await fxCanManageStore(vAuth, vStoreId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      const vResponse: IStoreDepartmentInstance = await ClassStoreDepartmentService.create(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId: number = Number(pReq.input('id', 'number'))
      const vExisting: IStoreDepartmentInstance | null = await ClassStoreDepartmentService.show(vId)
      if (!vExisting) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (!(await fxCanManageStore(vAuth, vExisting.dataValues.storeId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      // storeId no se toca desde update - un departamento no cambia de tienda.
      const vData: IStoreDepartmentInput = pReq.only(['id', 'name'])
      const vResponse: IStoreDepartmentInstance | null = await ClassStoreDepartmentService.update(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId: number = pReq.input('id', 'number')
      const vExisting: IStoreDepartmentInstance | null = await ClassStoreDepartmentService.show(vId)
      if (!vExisting) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      if (!(await fxCanManageStore(vAuth, vExisting.dataValues.storeId))) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      const vResponse: boolean = await ClassStoreDepartmentService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new StoreDepartmentController()
