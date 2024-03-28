/* 
- File: BankService.ts

- Purpose: 

- Author: Jairo Belen

- Creation: 26/03/2024  

==========Functions Manifest==========

- CurrencyService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import { modelBank } from '../../models'
import type { IBankInstance } from '../../models/payments/BankModel'
import type { IBankInput, IResponseAllBank } from '../../types/PaymentMethodType'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IBankService {
  validate(data: any): any
  all(pParam: any): Promise<IResponseAllBank | IBankInstance[]>
  show(pId: number): Promise<IBankInstance | null>
  create(payload: IBankInput): Promise<IBankInstance>
  update(payload: IBankInput): Promise<IBankInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class BankService implements IBankService {
  private modelName = 'Bank'
  async validate(data: any) {
    const dataValidate = modelBank.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllBank | IBankInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement,pParam?.typeSearch || 'name',
        this.modelName
      )

      const vResponse: IBankInstance[] = await modelBank.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllBank = await fxReponseServices(pParam, whereStatement, this.modelName, vResponse)
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IBankInstance | null> {
    try {
      const vResponse: IBankInstance | null = await modelBank.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IBankInput): Promise<IBankInstance> {
    try {
      const vResponse: IBankInstance = await modelBank.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IBankInput): Promise<IBankInstance | null> {
    try {
      if (pData?.id) {
        const vReponse: IBankInstance | null = await modelBank.findOne({
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
      const record = await modelBank.update({ deletedAt: new Date() }, {
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

export default new BankService()   