/* 
- File: TripOfertService.ts

- Purpose: 

- Author: Jairo Belen

- Creation: 15/02/2024  

==========Functions Manifest==========

- TripService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { Op, type FindOptions } from 'sequelize'
import { modelTripOfert } from '../../models'
import type { ITripOfertInstance } from '../../models/Trip/TripOffertModel'
import type { IResponseAllTripOfert, ITripOfertInput } from '../../types/TripType'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface ITripOfertService {
  validate(data: any): any
  show(pId: number): Promise<ITripOfertInstance | null>
  all(pParam: any): Promise<IResponseAllTripOfert | ITripOfertInstance[]>
  create(payload: ITripOfertInput): Promise<ITripOfertInstance>
  update(payload: ITripOfertInput): Promise<ITripOfertInstance | null>
  softDeleteRecord(pId:string): Promise<boolean>

}

class TripOfertService implements ITripOfertService {

  async validate(data: any) {
    const dataValidate = modelTripOfert.build(data)
    await dataValidate.validate()
  }

  async show(pId: number): Promise<ITripOfertInstance | null> {
    try {
      const vResponse: ITripOfertInstance | null = await modelTripOfert.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  public async all(pParam: any): Promise<IResponseAllTripOfert | ITripOfertInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name','tripOfert'
      )

      const vResponse: ITripOfertInstance[] = await modelTripOfert.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllTripOfert = await fxReponseServices(
          pParam,
          whereStatement,
          'tripOfert',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: ITripOfertInput): Promise<ITripOfertInstance> {
    const vResponse: ITripOfertInstance = await modelTripOfert.create(pData)
    return vResponse
  }

  async update(pData: ITripOfertInput): Promise<ITripOfertInstance | null> {
    const whereStatement: FindOptions = {}
    if (pData.tripId) {
      whereStatement.where = {
        tripId: pData.id,
        id: pData.id
      }
    } else if (pData.id) {
      whereStatement.where = {
        driverId: {
          [Op.or]: [pData.id, null]
        },
        id: pData.id
      }
    }
    if (pData?.id) {
      const vItem: ITripOfertInstance | null = await modelTripOfert.findOne(whereStatement)
      await vItem?.update(pData)
      return vItem
    }
    return null
  }
  async softDeleteRecord(pId: string) {
    try {
      const record = await modelTripOfert.update({ deletedAt: new Date() }, {
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

export default new TripOfertService()

