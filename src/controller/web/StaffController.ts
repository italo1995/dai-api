import type { NextFunction, Request, Response } from 'express'
import staffService from '../../services/web/StaffService'
import type { staffAttributes, staffReponseAll, staffInstance } from '../../models/web/StaffModel'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import StaffViewService from '../../services/web/StaffViewService'
import type { staffViewAttributes } from '../../models/web/StaffViewModel'

export const staff = {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = String(pReq.query.id)

      const vResponse: staffInstance | null = await staffService.show(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: staffReponseAll | staffInstance[] = await staffService.all(vParam)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: staffAttributes = pReq.only(['name'])
      const vModule: staffViewAttributes[] = pReq.input('module', 'json')
      const vResponse: staffInstance | null = await staffService.create(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      vModule.map((item: staffViewAttributes) => item.staffId = Number(vResponse.dataValues.id))
      await StaffViewService.createMany(vModule)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: staffAttributes = pReq.only(['id', 'name'])

      const vResponse: staffInstance | null = await staffService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  },

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = pReq.input('id', 'string')
      const vResponse: boolean = await staffService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  },
}
