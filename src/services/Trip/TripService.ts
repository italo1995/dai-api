/* 
- File: TripService.ts

- Purpose: 

- Author: Italo Belen

- Creation: 05/02/2024  

==========Functions Manifest==========

- TripService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { Op, type FindOptions } from 'sequelize'
import type { UUID } from 'crypto'
import { modelTrip } from '../../models'
import type { ITripInstance } from '../../models/Trip/TripModel'
import type { ITripInput, IResponseAllTrip, IParamAllTrip, IParamShowTrip } from '../../types/TripType'
import { fxOrderNameId, fxPaginate, fxSearchILike } from '../../utils/query'

interface ITripService {
  validate(data: any): any
  show(pParam: IParamShowTrip): Promise<ITripInstance | null>
  all(pParam: IParamAllTrip): Promise<IResponseAllTrip | ITripInstance[]>
  create(payload: ITripInput): Promise<ITripInstance>
  update(payload: ITripInput): Promise<ITripInstance | null>
}

class TripService implements ITripService {

  async validate(data: any) {
    const dataValidate = modelTrip.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: IParamAllTrip): Promise<IResponseAllTrip | ITripInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement, pParam?.typeSearch || 'name', 'Trip')
      if(pParam.isClient) {
        whereStatement.where = {
          ...whereStatement.where,
          userId: pParam.userId
        }
      } else {
        whereStatement.where = {
          ...whereStatement.where,
          driverId: pParam.userId
        }
      }
      const vRes = await modelTrip.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vLimit = Number(pParam?.limit) || 10
        const vCount = await modelTrip.count(whereStatement)
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

  async show(pParam: IParamShowTrip): Promise<ITripInstance | null> {
    const whereStatement: FindOptions = {}
    if(pParam.isClient) {
      whereStatement.where = {
        userId: pParam.userId,
        id: pParam.id
      }
    } else {
      whereStatement.where = {
        driverId: pParam.userId,
        id: pParam.id
      }
    }
    const vResponse: ITripInstance | null = await modelTrip.findOne(whereStatement)
    return vResponse
  }

  async create(pData: ITripInput): Promise<ITripInstance> {
    const vResponse: ITripInstance = await modelTrip.create(pData)
    return vResponse
  }

  async update(pData: ITripInput): Promise<ITripInstance | null> {
    const whereStatement: FindOptions = {}
    if (pData.userId) {
      whereStatement.where = {
        userId: pData.userId,
        id: pData.id
      }
    } else if (pData.driverId) {
      whereStatement.where = {
        driverId: {
          [Op.or]: [pData.userId, null]
        },
        id: pData.id
      }
    }
    if (pData?.id) {
      const vItem: ITripInstance | null = await modelTrip.findOne(whereStatement)
      await vItem?.update(pData)
      return vItem
    }
    return null
  }

  async softDeleteRecord(pId: number, pUserId: UUID) {
    try {
      const record = await modelTrip.update({ deletedAt: new Date() }, {
        where: { id: pId, userId: pUserId }
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
export default new TripService()

