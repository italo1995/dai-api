import type { NextFunction, Request, Response } from 'express'
import ClassCompanyParameterService from '../../services/web/CompanyParameterService'
import type { IResponseAll } from '../../types/generalType'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { ICompanyParameterInstance } from '../../models/web/CompanyParameterModel'

class CompanyParameterController {

  async all (pReq:Request, pRes: Response, pNext: NextFunction) {
    try{
      const vParam: any = pReq.query
      const vResponse: IResponseAll | ICompanyParameterInstance[] = await ClassCompanyParameterService.all(vParam)
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

  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const pId: number = Number(pReq.query.id)

      const vResponse: ICompanyParameterInstance | null = await ClassCompanyParameterService.show(pId)
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
      const vData: ICompanyParameterInstance = pReq.only([
        'name',
        'value',
        'type'
      ])
      const vResponse: ICompanyParameterInstance | null = await ClassCompanyParameterService.create(vData)
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
      const vData: ICompanyParameterInstance = pReq.only([
        'id',
        'name',
        'value',
        'type'
      ])
      const vResponse: ICompanyParameterInstance | null = await ClassCompanyParameterService.update(vData)
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
  
  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassCompanyParameterService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }

}

export default new CompanyParameterController()
