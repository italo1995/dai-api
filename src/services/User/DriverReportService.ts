/* 
- File: DriverReportService.ts

- Purpose: El serivicio DriverReport se encarga de almacenar el numero de viajes hechos por un driver y el monto de dinero acumulado

- Author: Jairo belen

- Creation: 01/04/2024  

==========Functions Manifest==========
- CommentService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item, es necesario agregar los datos totalAmount (precio de cada viaje) y tripCount (numero de viajes a agregar a quantity)
  4 - update: actualiza datos del item es necesario agregar los datos totalAmount (precio de cada viaje) y tripCount (numero de viajes a agregar a quantity)
*/
import { type FindOptions } from 'sequelize'
import type { IDriverReportInstance } from '../../models/User/driverReportModel'
import { modelDriverReport } from '../../models'
import type { IDriverReportInput, IResponseAllDriverReport } from '../../types/User'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IDriverReportService {
  validate(data: any): any
  show(pId: number): Promise<IDriverReportInstance | null>
  all(pParam: any): Promise<IResponseAllDriverReport | IDriverReportInstance[]>
  create(
    payload: IDriverReportInput,
    totalAmount: number,
    tripCount: number
  ): Promise<IDriverReportInstance>
  update(
    payload: IDriverReportInput,
    totalAmount: number,
    tripCount: number
  ): Promise<IDriverReportInstance | null>
}

class DriverReportService implements IDriverReportService {
  async validate(data: any) {
    const dataValidate = modelDriverReport.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllDriverReport | IDriverReportInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'DriverReport'
      )

      const vResponse: IDriverReportInstance[] = await modelDriverReport.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllDriverReport = await fxReponseServices(
          pParam,
          whereStatement,
          'driver_report',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IDriverReportInstance | null> {
    try {
      const vResponse: IDriverReportInstance | null = await modelDriverReport.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(
    pData: IDriverReportInput,
    totalAmount: number,
    tripCount: number
  ): Promise<IDriverReportInstance> {
    try {
      pData.amount = totalAmount
      pData.quantity = tripCount

      const vResponse: IDriverReportInstance = await modelDriverReport.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(
    pData: IDriverReportInput,
    totalAmount: number,
    tripCount: number
  ): Promise<IDriverReportInstance | null> {
    try {
      if (pData?.id) {
        pData.amount = totalAmount
        pData.quantity = tripCount

        const vReponse: IDriverReportInstance | null = await modelDriverReport.findOne({
          where: {
            id: pData.id,
          },
        })
        await vReponse?.update(pData, { where: { id: pData.id } })
        return vReponse
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async updatedOrCreate(pData: IDriverReportInput): Promise<IDriverReportInstance | null> {
    try {
      if (pData?.userId) {
        const vResponse: IDriverReportInstance | null = await modelDriverReport.findOne({
          where: {
            userId: pData.userId,
          },
        })
        if (vResponse) {
          await vResponse?.update({
            quantity: vResponse.dataValues.quantity + 1,
            amount: (vResponse?.dataValues?.amount || 0) + pData.amount,
          })
          return vResponse
        } else {
          const vCreate: IDriverReportInstance = await modelDriverReport.create({
            quantity: 1,
            amount: pData.amount,
            userId: pData.userId,
          })
          return vCreate
        }
      }
      return null
    } catch (error) {
      throw error
    }
  }
}
export default new DriverReportService()
