/* 
- File: RangePriceService.ts

- Author: Italo Belen

- Creation: 20/02/2024  
*/
import { Op, type FindOptions } from 'sequelize'
import type { IRangePriceInstance, IRangePriceAttributes } from '../../models/Locations/RangePriceModel'
import { modelCity, modelCountry, modelRangePrice, modelRegion } from '../../models'
import type { IResponseAll } from '../../types/generalType'
import { fxOrderNameId, fxPaginate, fxSearchILike } from '../../utils/query'

interface IRangePriceService {
  validate(data: any): any
  show(pId: number): Promise<IRangePriceInstance | null>
  showPrice(pParam: { city: string, region: string, country: string, isCar: boolean, isMoto: boolean}): Promise<IRangePriceInstance | null>
  create(payload: IRangePriceAttributes): Promise<IRangePriceInstance>
  update(payload: IRangePriceAttributes): Promise<IRangePriceInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
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
  async showPrice({ city, region, country, isCar, isMoto }: { city: string, region: string, country: string, isCar: boolean, isMoto: boolean}): Promise<IRangePriceInstance | null> {
    try {
      const whereStatement: FindOptions = {}
      whereStatement.include = [{
        model: modelCountry,
        as: 'country',
        required: false,
        where: {
          name: {
            [Op.iLike]: `%${country}%`
          }
        }
      },
      {
        model: modelRegion,
        as: 'region',
        required: false,
        where: {
          name: {
            [Op.iLike]: `%${region}%`
          }
        }
      },
      {
        model: modelCity,
        as: 'city',
        required: false,
        where: {
          name: {
            [Op.iLike]: `%${city}%`
          }
        }
      }]
      whereStatement.where = {
        isCar,
        isMoto
      }
      const vFindAll: IRangePriceInstance[] | null = await modelRangePrice.findAll(whereStatement)
      const vShowPriceJSON = JSON.parse(JSON.stringify(vFindAll))
      let vResponse: IRangePriceInstance | null = null
      vResponse = vShowPriceJSON.find((item: any) => item?.city) || vShowPriceJSON.find((item: any) => item?.region) || vShowPriceJSON.find((item: any) => item?.country)
      return vResponse
    } catch (error) {
      throw error
    }
  }
  async showPriceToId({ cityId, regionId, countryId, isCar, isMoto }: { cityId?: number | null, regionId?: number | null, countryId?: number | null, isCar: boolean, isMoto: boolean}): Promise<IRangePriceInstance | null> {
    try {
      const whereStatement: FindOptions = {}
      // whereStatement.include = [{
      //   model: modelCountry,
      //   as: 'country',
      //   required: false,
      //   where: {
      //     name: {
      //       [Op.iLike]: `%${countryId}%`
      //     }
      //   }
      // },
      // {
      //   model: modelRegion,
      //   as: 'region',
      //   required: false,
      //   where: {
      //     name: {
      //       [Op.iLike]: `%${regionId}%`
      //     }
      //   }
      // },
      // {
      //   model: modelCity,
      //   as: 'city',
      //   required: false,
      //   where: {
      //     name: {
      //       [Op.iLike]: `%${cityId}%`
      //     }
      //   }
      // }]
      whereStatement.where = {
        isCar,
        isMoto,
        [Op.or]: {
          cityId: cityId,
          regionId: regionId,
          countryId: countryId,
        }
      }
      const vFindAll: IRangePriceInstance[] | null = await modelRangePrice.findAll(whereStatement)
      const vShowPriceJSON = JSON.parse(JSON.stringify(vFindAll))
      let vResponse: IRangePriceInstance | null = null
      vResponse = vShowPriceJSON.find((item: any) => item?.city) || vShowPriceJSON.find((item: any) => item?.region) || vShowPriceJSON.find((item: any) => item?.country)
      return vResponse
    } catch (error) {
      throw error
    }
  }
  async showPriceCopy(city: string, region: string, country: string): Promise<IRangePriceInstance | null> {
    try {
      let vResponse: IRangePriceInstance | null = await modelRangePrice.findOne({
        where: {
          cityId: city,
        },
        order: [
          ['createdAt', 'ASC']
        ]
      })
    
      if (!vResponse) {
        vResponse = await modelRangePrice.findOne({
          where: {
            regionId: region,
          },
          order: [
            ['createdAt', 'ASC']
          ]
        })
      }
    
      if (!vResponse) {
        vResponse = await modelRangePrice.findOne({
          where: {
            countryId: country,
          },
          order: [
            ['createdAt', 'ASC']
          ]
        })
      }
    
      return vResponse 
    } catch (error) {
      throw error
    }
  }
  async create(pData: IRangePriceAttributes): Promise<IRangePriceInstance> {
    try {
      const vResponse: IRangePriceInstance = await modelRangePrice.create(pData)
      return vResponse 
    } catch (error) {
      throw error
    }
  }

  async update(pData: IRangePriceAttributes): Promise<IRangePriceInstance | null> {
    try {
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
    } catch (error) {
      throw error
    }
  }

  async softDeleteRecord(pId: number) {
    try {
      const record = await modelRangePrice.update({ deletedAt: new Date() }, {
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
export default new RangePriceService()
