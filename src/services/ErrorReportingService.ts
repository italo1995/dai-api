import { DatabaseError, type FindOptions } from 'sequelize'
import { modelErrorReporting } from '../models'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../utils/query'

interface IDataError {
  url: string
  headers: any
  body: any
  userId: string
}
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
}
export default new ErrorReportingService()
