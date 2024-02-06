/* 
- File: TripService.ts

- Purpose: 

- Author: Italo Belen

- Creation: 05/02/2024  

==========Functions Manifest==========

- TripService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import type { UUID } from 'crypto'
import { modelTripPayment } from '../../models'
import type { ITripPaymentInstance } from '../../models/Trip/TripPaymentModel'
import type { ITripPaymentInput, IResponseAllTripPayment } from '../../types/TripType'
import { fxOrderNameId, fxPaginate, fxSearchILike } from '../../utils/query'

interface ITripPaymentService {
  validate(data: any): any
  show(pId: number, pUserId: UUID): Promise<ITripPaymentInstance | null>
  all(pParam: any): Promise<IResponseAllTripPayment | ITripPaymentInstance[]>
  create(payload: ITripPaymentInput): Promise<ITripPaymentInstance>
  update(payload: ITripPaymentInput): Promise<ITripPaymentInstance | null>
}

class TripPaymentService implements ITripPaymentService {

  async validate(data: any) {
    const dataValidate = modelTripPayment.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllTripPayment | ITripPaymentInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement, pParam?.typeSearch || 'name', 'Trip')
      whereStatement.where = {
        ...whereStatement.where,
        userId: pParam.userId
      }
      const vRes = await modelTripPayment.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vLimit = Number(pParam?.limit) || 10
        const vCount = await modelTripPayment.count(whereStatement)
        const vResp = {
          total: vCount,
          totalPage: Math.ceil(vCount / vLimit),
          data: vRes,
          actualPage: Number(pParam.pag),
        }
        return vResp
      }

      return vRes
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<ITripPaymentInstance | null> {
    const vResponse: ITripPaymentInstance | null = await modelTripPayment.findOne({
      where: {
        id: pId,
      },
    })
    return vResponse
  }

  async create(pData: ITripPaymentInput): Promise<ITripPaymentInstance> {
    const vResponse: ITripPaymentInstance = await modelTripPayment.create(pData)
    return vResponse
  }

  async update(pData: ITripPaymentInput): Promise<ITripPaymentInstance | null> {
    if (pData?.id) {
      const vItem: ITripPaymentInstance | null = await modelTripPayment.findOne({
        where: {
          id: pData.id,
        },
      })
      await vItem?.update(pData)
      return vItem
    }
    return null
  }

  async softDeleteRecord(pId: number) {
    try {
      const record = await modelTripPayment.update({ deletedAt: new Date() }, {
        where: { id: pId }
      })
      if (!record) {
        return false
      }
      return true
    } catch (error) {
      throw error
    }
  }
}
export default new TripPaymentService()

