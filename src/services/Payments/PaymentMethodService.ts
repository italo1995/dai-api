/* 
- File: PaymentMethodService.ts

- Purpose: 

- Author: Jairo Belen

- Creation: 06/02/2024  

==========Functions Manifest==========

- PaymentMethodService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import type { UUID } from 'crypto'
import { modelPaymentMethod, modelTripPayment } from '../../models'
import type { IPaymentMethodInstance } from '../../models/payments/PaymentMethodModel'
import type { ITripInput, IResponseAllTrip } from '../../types/PaymentMethodType'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IPaymentMethodService {
    validate(data: any): any
    show(pId: number, pUserId: UUID): Promise<IPaymentMethodInstance | null>
    all(pParam: any): Promise<IResponseAllTrip | IPaymentMethodInstance[]>
    create(payload: ITripInput): Promise<IPaymentMethodInstance>
    update(payload: ITripInput): Promise<IPaymentMethodInstance | null>
    softDeleteRecord(pId: number): Promise<boolean>
}

class PaymentMethodService implements IPaymentMethodService {
  async validate(data: any) {
    const dataValidate = modelTripPayment.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllTrip | IPaymentMethodInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement,pParam?.typeSearch || 'name',
        'PaymentMethod'
      )

      const vResponse: IPaymentMethodInstance[] = await modelPaymentMethod.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllTrip = await fxReponseServices(pParam, whereStatement, 'PaymentMethod', vResponse)
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }
  async show(pId: number): Promise<IPaymentMethodInstance | null> {
    const vResponse: IPaymentMethodInstance | null = await modelPaymentMethod.findOne({
      where: {
        id: pId,
      },
    })
    return vResponse
  }

  async create(pData: ITripInput): Promise<IPaymentMethodInstance> {
    try {
      const vResponse: IPaymentMethodInstance = await modelPaymentMethod.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: ITripInput): Promise<IPaymentMethodInstance | null> {
    try {
      if (pData?.id) {
        const vReponse: IPaymentMethodInstance | null = await modelPaymentMethod.findOne({
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
  async softDeleteRecord(pId: number) {
    try {
      const record = await modelPaymentMethod.update({ deletedAt: new Date() }, {
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
export default new PaymentMethodService()
