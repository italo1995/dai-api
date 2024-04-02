/* 
- File: DataContentController.ts

- Purpose: Es el controlador de DataContent se encarga de informaciones diversas de la aplicacion para el usuario
- Author: jairo Belen

- Creation: 16/03/2024  
 */
import type { NextFunction, Request, Response } from 'express'
import ClassDataContentService from '../../services/web/DataContentService'
import type { IDataContentInput, IResponseAllDataContent } from '../../types/webTypes'
import { fxSuccessResponse, fxErrorResponse, moveImages } from '../../utils/helpers'
import type { IDataContentInstance } from '../../models/web/DataContentModel'

class DataContentController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: IDataContentInstance | null = await ClassDataContentService.show(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async showType(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vType: string | null = pReq.input('type', 'string')
      if (vType) {
        const vResponse: IDataContentInstance | null = await ClassDataContentService.showType(vType)
        if (!vResponse) {
          return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
        }
        return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
      }
      return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAllDataContent | IDataContentInstance[] =
        await ClassDataContentService.all(vParam)
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
      const vData: IDataContentInput = pReq.only(['name', 'description', 'image', 'orden', 'type'])
      if (vData?.image && vData?.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      const vResponse: IDataContentInstance | null = await ClassDataContentService.create(vData)
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
      const vData: IDataContentInput = pReq.only([
        'id',
        'name',
        'description',
        'image',
        'orden',
        'type',
      ])
      if (vData?.image && vData?.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      const vResponse: IDataContentInstance | null = await ClassDataContentService.update(vData)
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
      const vResponse: boolean = await ClassDataContentService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new DataContentController()
