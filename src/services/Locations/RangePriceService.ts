/* 
- File: RangePriceService.ts

- Author: Italo Belen

- Creation: 20/02/2024  
*/
import { type FindOptions } from 'sequelize'
import type { IRangePriceInstance, IRangePriceAttributes } from '../../models/Locations/RangePriceModel'
import { modelRangePrice } from '../../models'
import type { IResponseAll } from '../../types/generalType'
import { fxOrderNameId, fxPaginate, fxSearchILike } from '../../utils/query'

interface IRangePriceService {
  validate(data: any): any
  show(pId: number): Promise<IRangePriceInstance | null>
  create(payload: IRangePriceAttributes): Promise<IRangePriceInstance>
  update(payload: IRangePriceAttributes): Promise<IRangePriceInstance | null>
}

class RangePriceService implements IRangePriceService {

  async validate(data: any) {
    const dataValidate = modelRangePrice.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAll | IRangePriceInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement, pParam?.typeSearch || 'name', modelRangePrice.name)
      const vRes = await modelRangePrice.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vLimit = Number(pParam?.limit) || 10
        const vCount = await modelRangePrice.count(whereStatement)
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

  async show(pId: number): Promise<IRangePriceInstance | null> {
    const vResponse: IRangePriceInstance | null = await modelRangePrice.findOne({
      where: {
        id: pId,
      },
    })
    return vResponse
  }

  async showPrice(pId: number): Promise<IRangePriceInstance | null> {
    const vResponse: IRangePriceInstance | null = await modelRangePrice.findOne({
      where: {
        id: pId,
      },
    })
    return vResponse
  }

  async create(pData: IRangePriceAttributes): Promise<IRangePriceInstance> {
    const vResponse: IRangePriceInstance = await modelRangePrice.create(pData)
    return vResponse
  }

  async update(pData: IRangePriceAttributes): Promise<IRangePriceInstance | null> {
    if (pData?.id) {
      const vRangePrice: IRangePriceInstance | null = await modelRangePrice.findOne({
        where: {
          id: pData.id,
        },
      })
      await vRangePrice?.update(pData, { where: { id: pData.id } })
      return vRangePrice
    }
    return null
  }
}
export default new RangePriceService()
