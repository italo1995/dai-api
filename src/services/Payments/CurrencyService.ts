/* 
- File: CurrencyService.ts

- Purpose: 

- Author: Jairo Belen

- Creation: 06/02/2024  

==========Functions Manifest==========

- CurrencyService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import { modelCurrency } from '../../models'
import type { ICurrencyInstance } from '../../models/payments/CurrencyModel'
import type { ITripInput, IResponseAllTrip } from '../../types/CurrencyType'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface ICurrencyService {
  validate(data: any): any
  all(pParam: any): Promise<IResponseAllTrip | ICurrencyInstance[]>
  show(pId: number): Promise<ICurrencyInstance | null>
  create(payload: ITripInput): Promise<ICurrencyInstance>
  update(payload: ITripInput): Promise<ICurrencyInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class CurrencyService implements ICurrencyService {
  private modelName = 'Currency'
  async validate(data: any) {
    const dataValidate = modelCurrency.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllTrip | ICurrencyInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement,pParam?.typeSearch || 'name',
        this.modelName
      )

      const vResponse: ICurrencyInstance[] = await modelCurrency.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllTrip = await fxReponseServices(pParam, whereStatement, this.modelName, vResponse)
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<ICurrencyInstance | null> {
    try {
      const vResponse: ICurrencyInstance | null = await modelCurrency.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: ITripInput): Promise<ICurrencyInstance> {
    try {
      const vResponse: ICurrencyInstance = await modelCurrency.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: ITripInput): Promise<ICurrencyInstance | null> {
    try {
      if (pData?.id) {
        const vReponse: ICurrencyInstance | null = await modelCurrency.findOne({
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
      const record = await modelCurrency.update({ deletedAt: new Date() }, {
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

export default new CurrencyService()   
