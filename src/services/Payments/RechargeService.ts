import { type FindOptions } from 'sequelize'
import { modelRecharge } from '../../models'
import type { rechargeInstance, rechargeAttributes, rechargeReponseAll } from '../../models/payments/RechargeModel'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IrechargeService {
  validate(data: any): any
  show(pId: string): Promise<rechargeInstance | null>
  create(payload: rechargeAttributes): Promise<rechargeInstance>
  update(payload: rechargeAttributes): Promise<rechargeInstance | null>
  softDeleteRecord(pId: string): Promise<boolean>
}

class rechargeService implements IrechargeService {
  async validate(data: any) {
    const dataValidate = modelRecharge.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<rechargeReponseAll | rechargeInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'recharge'
      )

      const vResponse: rechargeInstance[] = await modelRecharge.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: rechargeReponseAll = await fxReponseServices(
          pParam,
          whereStatement,
          'recharge',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: string): Promise<rechargeInstance | null> {
    try {
      const vResponse: rechargeInstance | null = await modelRecharge.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: rechargeAttributes): Promise<rechargeInstance> {
    try {
      const vResponse: rechargeInstance = await modelRecharge.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: rechargeAttributes): Promise<rechargeInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: rechargeInstance | null = await modelRecharge.findOne({
          where: {
            id: pData.id,
          },
        })
        await vCountry?.update(pData, { where: { id: pData.id } })
        return vCountry
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async softDeleteRecord(pId: string): Promise<boolean> {
    try {
      const record = await modelRecharge.update(
        { deletedAt: new Date() },
        {
          where: { id: pId },
        }
      )
      if (!record) {
        return false
      }
      return true
    } catch (error) {
      throw error
    }
  }
}

export default new rechargeService()
