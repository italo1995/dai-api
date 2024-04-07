import { Sequelize, type FindOptions } from 'sequelize'
import { modelBank, modelCurrency, modelRecharge } from '../../models'
import type {
  rechargeInstance,
  rechargeAttributes,
  rechargeReponseAll,
} from '../../models/payments/RechargeModel'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices, fxFilterDate } from '../../utils/query'
import { subtractTimeUnitFromCurrentDate } from '../../utils/helpers'

interface IrechargeService {
  validate(data: any): any
  show(pId: number): Promise<rechargeInstance | null>
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
      whereStatement.where = fxFilterDate(pParam, whereStatement)
      if (pParam?.userId) {
        whereStatement.where = {
          ...whereStatement.where,
          userId: pParam.userId
        }
      }
      if (pParam.filterDate) {
        const timeFilter = subtractTimeUnitFromCurrentDate(pParam.filterDate)
        const currentDate = new Date()
        pParam = {
          ...pParam,
          initDate: timeFilter,
          endDate: `${currentDate.getFullYear()}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}`
        }
        console.log('pParam :>> ', pParam)
        whereStatement.where = fxFilterDate(pParam, whereStatement)
      }
      whereStatement.include = [
        {
          model: modelBank,
          as: 'usedBank'
        },
        {
          model: modelCurrency,
          as: 'currency'
        }
      ]
      const vResponse: rechargeInstance[] = await modelRecharge.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: rechargeReponseAll = await fxReponseServices(
          pParam,
          whereStatement,
          'recharge',
          vResponse
        )
        if (pParam?.again && pParam.userId) {
          whereStatement.include = []
          delete whereStatement.limit
          delete whereStatement.offset
          whereStatement.attributes = [
            [Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount'],
            'userId',
          ]
          whereStatement.group = ['user_id']
          delete whereStatement.order
          vResponsePaginate.totalAmount = await modelRecharge.unscoped().findAll(whereStatement)
        }
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      console.log('error :>> ', error)
      throw error
    }
  }

  async show(pId: number): Promise<rechargeInstance | null> {
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
