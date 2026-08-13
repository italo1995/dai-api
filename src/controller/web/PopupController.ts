/*
- File: PopupController.ts

- Purpose: Controlador del PopUp publicitario inicial (CMS). Administra hasta MAX_POPUPS
  imágenes con orden, link y estado activo/inactivo, mostradas como popup al abrir la app/web.

- Author: Claude

- Creation: 08/08/2026

==========Functions Manifest==========
Para todos los casos, si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1 - show: trae un popup por id
2 - all: endpoint publico para la app/cliente. Solo popups activos, solo los campos que la app
    necesita para renderizar (id, image, link, orden). Sin timestamps, sin paginacion.
3 - allAdmin: endpoint para el panel admin (requiere Bearer). Todos los popups, todos los
    campos, con paginacion/busqueda opcional.
4 - create: crea un popup nuevo. Rechaza con 500 si ya existen MAX_POPUPS (activos o no) creados
5 - update: actualiza name/image/orden/link/state de un popup existente
6 - updateOrder: actualiza el campo orden de varios popups de una sola vez (reordenar)
7 - destroy: elimina (soft delete) un popup
 */
import type { NextFunction, Request, Response } from 'express'
import ClassPopupService, { MAX_POPUPS } from '../../services/web/PopupService'
import type { IPopupInput, IPopupOrderInput, IPopupPublic, IResponseAllPopup } from '../../types/webTypes'
import { fxSuccessResponse, fxErrorResponse, moveImages } from '../../utils/helpers'
import type { IPopupInstance } from '../../models/web/PopupModel'

class PopupController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: IPopupInstance | null = await ClassPopupService.show(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(_pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vResponse: IPopupPublic[] = await ClassPopupService.all()
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async allAdmin(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAllPopup | IPopupInstance[] = await ClassPopupService.allAdmin(vParam)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vCount: number = await ClassPopupService.countActive()
      if (vCount >= MAX_POPUPS) {
        return pRes
          .status(500)
          .send(
            fxErrorResponse(
              500,
              null,
              `No se pueden crear más de ${MAX_POPUPS} popups. Elimina uno para poder agregar otro.`
            )
          )
      }
      const vData: IPopupInput = pReq.only(['name', 'image', 'orden', 'link', 'state'])
      if (vData?.image && vData?.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      const vResponse: IPopupInstance | null = await ClassPopupService.create(vData)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IPopupInput = pReq.only(['id', 'name', 'image', 'orden', 'link', 'state'])
      if (vData?.image && vData?.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      const vResponse: IPopupInstance | null = await ClassPopupService.update(vData)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async updateOrder(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IPopupOrderInput[] = pReq.input('data', 'json')
      if (!Array.isArray(vData) || !vData.length) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Se requiere el arreglo data'))
      }
      const vUpdateData: IPopupOrderInput[] = vData
        .filter((item) => item?.id)
        .map((item) => ({ id: Number(item.id), orden: Number(item.orden) }))
      const vResponse: IPopupInstance[] = await ClassPopupService.updateOrder(vUpdateData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassPopupService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new PopupController()
