import { DatabaseError, type FindOptions } from 'sequelize'
import { modelErrorReporting } from '../models'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../utils/query'

interface IDataError {
  url: string
  headers: any
  body: any
  userId: string
}

// Error reportado por la app movil (POST /api/errorReporting/app, pedido por Ricardo 2026-10-29).
export interface IAppErrorInput {
  message: string
  stack?: string
  screen?: string
  platform?: string
  appVersion?: string
  device?: string
  extra?: any
}

// Cortes de longitud: el endpoint es publico (los errores pueden pasar antes del login), asi que
// no se guarda cualquier tamano que mande el cliente.
const APP_ERROR_MAX_MESSAGE = 1000
const APP_ERROR_MAX_STACK = 8000
const APP_ERROR_MAX_FIELD = 200
const APP_ERROR_MAX_EXTRA = 4000
const fxCut = (pValue: any, pMax: number): string | null =>
  pValue === undefined || pValue === null ? null : String(pValue).slice(0, pMax)
class ErrorReportingService {
  // Unica forma de ver los errores hasta ahora era conectandose directo a la base - esto le da
  // una vista al panel (ver ErrorReportingController.all / vista oculta en el admin). Busca por
  // 'type' (el 'url'/evento que origino el error, ej 'changeState', 'disconnect', o un path
  // HTTP real) porque es lo unico corto y legible para filtrar - 'data'/'error' son JSON largos.
  async all(pParam: any) {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement, pParam?.typeSearch || 'type', modelErrorReporting.name)
      const vResponse = await modelErrorReporting.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        return fxReponseServices(pParam, whereStatement, modelErrorReporting.name, vResponse)
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async errorCreatedReporting(dataError: IDataError, error: any) {
    if (error instanceof DatabaseError) {
      console.log('El error es de tipo SequelizeDatabaseError')
    }
    const body = dataError.body
    const headers = dataError.headers
    const newErrorReporting = {
      type: dataError?.url || 'socket',
      data: JSON.stringify({
        request: {
          url: dataError.url,
          headers: headers,
          body: body,
        },
        userId: dataError.userId,
      }),
      error: JSON.stringify({
        message: error?.message,
        stack: error?.stack,
      }),
    }
    await modelErrorReporting.create(newErrorReporting)
  }

  // Misma tabla que los errores del servidor, con type 'app' para filtrarlos en el panel. No se
  // guardan headers (traen el token del usuario).
  async createFromApp(pData: IAppErrorInput, pUserId: string | null) {
    const vExtra = pData.extra === undefined ? null : fxCut(JSON.stringify(pData.extra), APP_ERROR_MAX_EXTRA)
    return modelErrorReporting.create({
      type: 'app',
      data: JSON.stringify({
        screen: fxCut(pData.screen, APP_ERROR_MAX_FIELD),
        platform: fxCut(pData.platform, APP_ERROR_MAX_FIELD),
        appVersion: fxCut(pData.appVersion, APP_ERROR_MAX_FIELD),
        device: fxCut(pData.device, APP_ERROR_MAX_FIELD),
        extra: vExtra,
        userId: pUserId,
      }),
      error: JSON.stringify({
        message: fxCut(pData.message, APP_ERROR_MAX_MESSAGE),
        stack: fxCut(pData.stack, APP_ERROR_MAX_STACK),
      }),
    })
  }
}
export default new ErrorReportingService()
