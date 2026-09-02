/*
- File: ErrorReportingController.ts

- Purpose: Panel de solo-lectura para ver los errores capturados por ErrorReportingService
  (excepciones de rutas HTTP y de eventos de socket) sin tener que conectarse directo a la base
  de datos. Pedido por Italo (2026-09-02) para poder diagnosticar problemas reportados en
  pruebas reales sin depender de acceso a la DB.
*/
import type { NextFunction, Request, Response } from 'express'
import ClassErrorReporting from '../services/ErrorReportingService'
import { fxSuccessResponse, fxErrorResponse } from '../utils/helpers'

class ErrorReportingController {
  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse = await ClassErrorReporting.all(vParam)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new ErrorReportingController()
