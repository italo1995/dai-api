/* 
- File: CompanyParameterService.ts

- Author: Jairo Belen

- Creation: 23/02/2024  
*/
import { type FindOptions } from 'sequelize'
import type { ICompanyParameterInstance, ICompanyParameterAttributes } from '../../models/web/CompanyParameterModel'
import { modelCompanyParameter } from '../../models'
import type { IResponseAll } from '../../types/generalType'
import { fxOrderNameId, fxPaginate, fxSearchILike } from '../../utils/query'

interface ICOmpanyParameterService {
  validate(data: any): any
  show(pId: number): Promise<ICompanyParameterInstance | null>
  create(payload: ICompanyParameterAttributes): Promise<ICompanyParameterInstance>
  update(payload: ICompanyParameterAttributes): Promise<ICompanyParameterInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class COmpanyParameterService implements ICOmpanyParameterService {

  async validate(data: any) {
    const dataValidate = modelCompanyParameter.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAll | ICompanyParameterInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement, pParam?.typeSearch || 'name', modelCompanyParameter.name)
      const vRes = await modelCompanyParameter.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vLimit = Number(pParam?.limit) || 10
        const vCount = await modelCompanyParameter.count(whereStatement)
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

  async show(pId: number): Promise<ICompanyParameterInstance | null> {
    const vResponse: ICompanyParameterInstance | null = await modelCompanyParameter.findOne({
      where: {
        id: pId,
      },
    })
    return vResponse
  }

  async create(pData: ICompanyParameterAttributes): Promise<ICompanyParameterInstance> {
    const vResponse: ICompanyParameterInstance = await modelCompanyParameter.create(pData)
    return vResponse
  }

  async update(pData: ICompanyParameterAttributes): Promise<ICompanyParameterInstance | null> {
    if (pData?.id) {
      const vRangePrice: ICompanyParameterInstance | null = await modelCompanyParameter.findOne({
        where: {
          id: pData.id,
        },
      })
      await vRangePrice?.update(pData, { where: { id: pData.id } })
      return vRangePrice
    }
    return null
  }

  async softDeleteRecord(pId: number) {
    try {
      const record = await modelCompanyParameter.update({ deletedAt: new Date() }, {
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
export default new COmpanyParameterService()
