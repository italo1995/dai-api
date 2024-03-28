/* 
- File: Branchervice.ts

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
import { modelBranch } from '../../models'
import type { IBranchInstance } from '../../models/payments/BranchModel'
import type { IBranchInput, IResponseAllBranch } from '../../types/PaymentMethodType'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IBranchService {
  validate(data: any): any
  all(pParam: any): Promise<IResponseAllBranch | IBranchInstance[]>
  show(pId: number): Promise<IBranchInstance | null>
  create(payload: IBranchInput): Promise<IBranchInstance>
  update(payload: IBranchInput): Promise<IBranchInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class BranchService implements IBranchService {
  private modelName = 'Branch'
  async validate(data: any) {
    const dataValidate = modelBranch.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllBranch | IBranchInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement,pParam?.typeSearch || 'name',
        this.modelName
      )

      const vResponse: IBranchInstance[] = await modelBranch.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllBranch = await fxReponseServices(pParam, whereStatement, this.modelName, vResponse)
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IBranchInstance | null> {
    try {
      const vResponse: IBranchInstance | null = await modelBranch.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IBranchInput): Promise<IBranchInstance> {
    try {
      const vResponse: IBranchInstance = await modelBranch.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IBranchInput): Promise<IBranchInstance | null> {
    try {
      if (pData?.id) {
        const vReponse: IBranchInstance | null = await modelBranch.findOne({
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
      const record = await modelBranch.update({ deletedAt: new Date() }, {
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

export default new BranchService()   