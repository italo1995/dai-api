/*
- File: ErrorReportingController.ts

- Purpose: Panel de solo-lectura para ver los errores capturados por ErrorReportingService
  (excepciones de rutas HTTP y de eventos de socket) sin tener que conectarse directo a la base
  de datos. Pedido por Italo (2026-09-02) para poder diagnosticar problemas reportados en
  pruebas reales sin depender de acceso a la DB.
*/
import type { NextFunction, Request, Response } from 'express'
import ClassErrorReporting, { type IAppErrorInput } from '../services/ErrorReportingService'
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

  // Errores enviados por la app movil (Ricardo, 2026-10-29). Publico porque un error puede pasar
  // antes del login; si viene token valido se guarda el userId. Limite simple en memoria por IP
  // para que un bucle de errores en un telefono no llene la tabla.
  async createFromApp(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      // El API corre detras del proxy del VPS (sin 'trust proxy'), asi que pReq.ip seria el mismo
      // para todos: se usa el usuario si viene logueado, si no la IP original del proxy.
      const vForwardedFor = String(pReq.headers['x-forwarded-for'] || '').split(',')[0].trim()
      const vKey = String(pReq.auth?.id || vForwardedFor || pReq.ip || 'unknown')
      const vNow = Date.now()
      const vEntry = vAppErrorHits.get(vKey)
      if (vEntry && vNow - vEntry.since < APP_ERROR_WINDOW_MS) {
        vEntry.count++
        if (vEntry.count > APP_ERROR_MAX_PER_WINDOW) {
          return pRes.status(429).send(fxErrorResponse(429, null, 'Demasiados reportes'))
        }
      } else {
        vAppErrorHits.set(vKey, { since: vNow, count: 1 })
      }
      const vData: IAppErrorInput = pReq.body || {}
      if (!vData.message) {
        return pRes.status(400).send(fxErrorResponse(400, null, 'message es requerido'))
      }
      await ClassErrorReporting.createFromApp(vData, pReq.auth?.id || null)
      return pRes.status(200).send(fxSuccessResponse(200, null, 'Error registrado'))
    } catch (error) {
      pNext(error)
    }
  }
}

const APP_ERROR_WINDOW_MS = 60 * 1000
const APP_ERROR_MAX_PER_WINDOW = 30
const vAppErrorHits = new Map<string, { since: number; count: number }>()
// Limpieza periodica para que el mapa no crezca sin limite.
setInterval(() => {
  const vNow = Date.now()
  for (const [vKey, vEntry] of vAppErrorHits) {
    if (vNow - vEntry.since >= APP_ERROR_WINDOW_MS) vAppErrorHits.delete(vKey)
  }
}, APP_ERROR_WINDOW_MS).unref()

export default new ErrorReportingController()
