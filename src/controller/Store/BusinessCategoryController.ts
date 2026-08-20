/*
- File: BusinessCategoryController.ts

- Purpose: Controlador de categorias de negocio (categorizan la tienda en si). Solo admin/operator
  pueden crear/editar/borrar (gateado en la ruta con authMiddleware('operator')). Lectura
  (show/all) es publica, la usa la app para el selector de categorias y los filtros del listado
  de tiendas.

==========Functions Manifest==========
Para todos los casos, si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1 - show: trae una categoria por id
2 - all: lista las categorias, opcionalmente filtradas por ?type=food|market
3 - allAdmin: version paginada/buscable para el panel
4 - create: crea una categoria nueva
5 - update: actualiza una categoria existente
6 - destroy: elimina (soft delete) una categoria
*/
import type { NextFunction, Request, Response } from 'express'
import ClassBusinessCategoryService from '../../services/Store/BusinessCategoryService'
import type { IBusinessCategoryInput } from '../../types/BusinessCategory'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { IBusinessCategoryInstance } from '../../models/Store/BusinessCategoryModel'

class BusinessCategoryController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)
      const vResponse: IBusinessCategoryInstance | null = await ClassBusinessCategoryService.show(vId)
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
      const vParam: any = pReq.query
      const vResponse = await ClassBusinessCategoryService.all(vParam)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async allAdmin(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse = await ClassBusinessCategoryService.allAdmin(vParam)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IBusinessCategoryInput = pReq.only(['name', 'type'])
      const vResponse: IBusinessCategoryInstance = await ClassBusinessCategoryService.create(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IBusinessCategoryInput = pReq.only(['id', 'name', 'type'])
      const vResponse: IBusinessCategoryInstance | null = await ClassBusinessCategoryService.update(vData)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassBusinessCategoryService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new BusinessCategoryController()
