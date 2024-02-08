/* 
- File: NewController.ts

- Purpose: Es el controlador de auth de noticias se encarga de las noticias mostradas en la aplicacion
- Author: Jairo Belen

- Creation: 01/02/2024  

==========Functions Manifest==========

- Paya Methods:
Para todo los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- show: Sirve un dato especifico filtrado por el id

2 - all: Sirve todos los datos guardados o paginado

3 - update: Cumple la funcion de recibir todos los datos que se pueden actualizarluego los envia a guardar en el servicio

4 - create: Esto es en caso de que en un futuro necesitos crear nuevos pero lo mas probable nunca se use

 */
import type { NextFunction, Request, Response } from 'express'
import ClassNewService from '../../services/web/newService'
import type { IWebInput, IResponseAllNew } from '../../types/webTypes'
import { fxSuccessResponse, fxErrorResponse, moveImages } from '../../utils/helpers'
import type { INewInstance } from '../../models/web/NewsModel'
import { modelNew } from '../../models'

class NewController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: INewInstance | null = await ClassNewService.show(vId)
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
  
  async all (pReq:Request, pRes: Response, pNext: NextFunction) {
    try{
      const vParam: any = pReq.query
      const vResponse: IResponseAllNew | INewInstance[] = await ClassNewService.all(vParam)
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
      const vData: IWebInput = pReq.only([
        'name',
        'image',
        'description',
        'state',
        'isFeatured',
      ])
      if (vData?.image) {
        vData.image = await moveImages(vData.image)
      }
      const vResponse: INewInstance | null = await ClassNewService.create(vData)
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
      const vData: IWebInput = pReq.only([
        'id',
        'name',
        'image',
        'description',
        'state',
        'isFeatured',
      ])
      if (vData?.image && vData?.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      const vResponse: INewInstance | null = await ClassNewService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null}, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  }
  async softDeleteRecord(pId: number) {
    try {
      const record = await modelNew.update({ deletedAt: new Date() }, {
        where: { id: pId }
      })
      if (!record) {
        return false
      }
      return true
    } catch (error) {
      throw error
    }
  }
}

export default new NewController()
