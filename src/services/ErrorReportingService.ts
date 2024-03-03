import { DatabaseError } from 'sequelize'
import { modelErrorReporting } from '../models'

interface IDataError {
  url: string, headers: any, body: any, userId: string
 }
class ErrorReportingService {
  async errorCreatedReporting(dataError: IDataError, error: any) {
    if (error instanceof DatabaseError) {
      console.log('El error es de tipo SequelizeDatabaseError')
      console.log('error.parent :>>', error.parent)
      console.log('error.original :>>', error.original)
      console.log('error.sql :>>', error.sql)
      console.log('error.parameters :>>', error.parameters)
    } 
    const body = dataError.body
    const headers = dataError.headers
    const newErrorReporting = {
      type: 'middelware',
      data: JSON.stringify({
        request: {
          url: dataError.url,
          headers: headers,
          body: body,
        },
        userId: dataError, // Asume que el usuario está en req.user
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
