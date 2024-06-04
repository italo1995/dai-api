import { Op, Sequelize, type FindOptions } from 'sequelize'
import { modelBank, modelBranch, modelCurrency, modelPaymentMethod, modelRecharge, modelUser } from '../../models'
import {
  type rechargeInstance,
  type rechargeAttributes,
  type rechargeReponseAll,
  ETypeRecharge,
} from '../../models/payments/RechargeModel'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices, fxFilterDate } from '../../utils/query'
import { subtractTimeUnitFromCurrentDate } from '../../utils/helpers'
import CurrencyService from './CurrencyService'
import { EPaymentType } from '../../models/payments/BankModel'

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
        whereStatement.where = fxFilterDate(pParam, whereStatement)
      }
      whereStatement.include = [
        {
          model: modelBank,
          as: 'usedBank',
          required: false
        },
        {
          model: modelPaymentMethod,
          as: 'paymentMethod',
          required: false
        },
        {
          model: modelCurrency,
          as: 'currency',
          required: false
        },
        {
          model: modelUser,
          as: 'user',
          required: false,
          attributes: ['id', 'name', 'phoneCode', 'phoneNumber'],
        },
        {
          model: modelUser,
          as: 'admin',
          required: false,
          attributes: ['id', 'name'],
          include: [
            {
              model: modelBranch,
              as: 'branch',
              required: false
            },
          ]
        },
      ]
      if (pParam?.operatorId) {
        whereStatement.where = {
          ...whereStatement.where,
          adminId: pParam.operatorId
        }
      }
      if (pParam?.paymentType && pParam.paymentType !== '0') {
        if (Number(pParam.paymentType) === EPaymentType.EFECTIVO) {
          whereStatement.where = {
            ...whereStatement.where,
            
          }
          whereStatement.include = [
            ...whereStatement.include,
            {
              model: modelBank,
              as: 'usedBank',
              required: true,
              where: {
                accountType: {
                  [Op.is]: null
                }
              }
            },
          ]
        } else {
          whereStatement.include = [
            ...whereStatement.include,
            {
              model: modelBank,
              as: 'usedBank',
              required: true,
              where: {
                accountType: {
                  [Op.not]: null
                }
              }
            },
          ]
        }
      }
      if (pParam?.branchId) {
        whereStatement.include = [
          ...whereStatement.include,
          {
            model: modelUser,
            as: 'admin',
            required: true,
            attributes: ['id', 'name'],
            where: {
              branchId: pParam.branchId
            },
            include: [
              {
                model: modelBranch,
                as: 'branch',
                required: false
              },
            ]
          },
        ]
      }
      if (pParam?.transactionType && pParam?.transactionType !== '0') {
        whereStatement.where = {
          ...whereStatement.where,
          type: Number(pParam.transactionType)
        }
      }
      const vResponse: rechargeInstance[] = await modelRecharge.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: rechargeReponseAll = await fxReponseServices(
          pParam,
          whereStatement,
          'recharge',
          vResponse
        )
        if (pParam?.again) {
          let totalAgain = 0
          for (const item of vResponse) {
            if (item?.dataValues?.type === ETypeRecharge.recharge) {
              totalAgain += await CurrencyService.convert({ currencyId: Number(item?.dataValues.currencyId), amount: Number(item?.dataValues?.amount) })
            }
          }
          vResponsePaginate.totalAgainFilter = totalAgain

          const whereStatementNotFilter: FindOptions = {}
          whereStatementNotFilter.attributes = [
            [Sequelize.fn('sum', Sequelize.col('amount')), 'totalAmount'],
            'currencyId', 'userId'
          ]
          whereStatementNotFilter.group = ['currencyId', 'userId']
          const again: any = await modelRecharge.unscoped().findAll(whereStatementNotFilter)
          if (again) {
            vResponsePaginate.totalAmount = again
            let totalAgain = 0
            for (const item of again) {
              totalAgain += await CurrencyService.convert({ currencyId: Number(item?.dataValues.currencyId), amount: Number(item?.dataValues?.again) })
            }
            vResponsePaginate.totalAgain = totalAgain
          } else {
            vResponsePaginate.totalAmount = 0
          }
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
