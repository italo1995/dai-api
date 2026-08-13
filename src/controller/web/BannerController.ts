/* 
- File: BannerController.ts

- Purpose: Es el controlador de auth de Banner se encarga del banner principal
- Author: Jairo Belen

- Creation: 31/01/2024  

==========Functions Manifest==========

- Paya Methods:
Para todo los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- show: Sirve un dato especifico filtrado por el id

2 - all: endpoint publico para la app. Hasta MAX_BANNERS banners activos (los de isPriority
    primero, el resto elegido al azar en cada consulta). Ver BannerService.all

3 - allAdmin: endpoint para el panel admin (requiere Bearer). Todos los banners, sin
    randomizar, con paginacion/busqueda opcional

4 - update: Cumple la funcion de recibir todos los datos que se pueden actualizarluego los envia a guardar en el servicio

5 - create: Esto es en caso de que en un futuro necesitos crear nuevos pero lo mas probable nunca se use

 */
import type { NextFunction, Request, Response } from 'express'
import ClassBannerService from '../../services/web/BannerService'
import type { IBannerInput, IBannerPublic, IResponseAllBanner } from '../../types/webTypes'
import { fxSuccessResponse, fxErrorResponse, moveImages } from '../../utils/helpers'
import type { IBannerInstance } from '../../models/web/BannerModel'

class BannerController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: IBannerInstance | null = await ClassBannerService.show(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(_pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vResponse: IBannerPublic[] = await ClassBannerService.all()
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async allAdmin(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAllBanner | IBannerInstance[] = await ClassBannerService.allAdmin(vParam)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IBannerInput = pReq.only(['name', 'image', 'orden', 'link', 'state', 'isPriority'])
      if (vData?.image && vData?.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      const vResponse: IBannerInstance | null = await ClassBannerService.create(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IBannerInput = pReq.only(['id', 'name', 'image', 'orden', 'link', 'state', 'isPriority'])
      if (vData?.image && vData?.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      const vResponse: IBannerInstance | null = await ClassBannerService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  }
  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassBannerService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new BannerController()
