/*
- File: MediaLibraryItemController.ts

- Purpose: Controlador de la libreria de iconos/imagenes genericos. Solo admin/operator pueden
  crear/editar/borrar (gateado en la ruta con authMiddleware('operator')). Lectura (show/all) es
  publica, la usa cualquier form que ofrezca "elegir un icono generico" (ej: metodos de pago de
  tienda).

==========Functions Manifest==========
Para todos los casos, si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1 - show: trae un item por id
2 - all: lista los items, opcionalmente filtrados por ?type=
3 - allAdmin: version paginada/buscable para el panel
4 - create: crea un item nuevo
5 - update: actualiza un item existente
6 - destroy: elimina (soft delete) un item
*/
import type { NextFunction, Request, Response } from 'express'
import ClassMediaLibraryItemService from '../../services/Media/MediaLibraryItemService'
import type { IMediaLibraryItemInput } from '../../types/MediaLibraryItem'
import { fxSuccessResponse, fxErrorResponse, moveImages } from '../../utils/helpers'
import type { IMediaLibraryItemInstance } from '../../models/Media/MediaLibraryItemModel'

class MediaLibraryItemController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)
      const vResponse: IMediaLibraryItemInstance | null = await ClassMediaLibraryItemService.show(vId)
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
      const vResponse = await ClassMediaLibraryItemService.all(vParam)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async allAdmin(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse = await ClassMediaLibraryItemService.allAdmin(vParam)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IMediaLibraryItemInput = pReq.only(['name', 'image', 'type', 'isActive'])
      if (vData?.image && vData.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      const vResponse: IMediaLibraryItemInstance = await ClassMediaLibraryItemService.create(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IMediaLibraryItemInput = pReq.only(['id', 'name', 'image', 'type', 'isActive'])
      if (vData?.image && vData.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      const vResponse: IMediaLibraryItemInstance | null = await ClassMediaLibraryItemService.update(vData)
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
      const vResponse: boolean = await ClassMediaLibraryItemService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new MediaLibraryItemController()
