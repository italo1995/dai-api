/* 
- File: HelpINformationController.ts

- Purpose: Es el controlador de HelpInformation se encarga de la informacion de ayuda de la aplicacion
- Author: jairo Belen

- Creation: 15/03/2024  
 */
import type { NextFunction, Request, Response } from 'express'
import ClassHelpInformationService from '../../services/web/HelpInformationService'
import type { IHelpInformationInput, IResponseAllHelpInformation } from '../../types/webTypes'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { IHelpInformationInstance } from '../../models/web/HelpInfomationModel'

class HelpInformationController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: IHelpInformationInstance | null = await ClassHelpInformationService.show(vId)
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

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAllHelpInformation | IHelpInformationInstance[] =
        await ClassHelpInformationService.all(vParam)
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
      const vData: IHelpInformationInput = pReq.only(['name', 'description', 'orden'])
      const vResponse: IHelpInformationInstance | null =
        await ClassHelpInformationService.create(vData)
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
      const vData: IHelpInformationInput = pReq.only(['id', 'name', 'description', 'orden'])
      const vResponse: IHelpInformationInstance | null =
        await ClassHelpInformationService.update(vData)
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
      const vResponse: boolean = await ClassHelpInformationService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new HelpInformationController()
