/* 
- File: TripOffertService.ts

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
import { modelTripOffert } from '../../models'
import type { ITripOffertInstance } from '../../models/Trip/TripOffertModel'
import type { IResponseAllTripOffert, ITripOffertInput } from '../../types/TripType'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface ITripOffertService {
  validate(data: any): any
  show(pId: number): Promise<ITripOffertInstance | null>
  all(pParam: any): Promise<IResponseAllTripOffert | ITripOffertInstance[]>
  create(payload: ITripOffertInput): Promise<ITripOffertInstance>
  update(payload: ITripOffertInput): Promise<ITripOffertInstance | null>
  softDeleteRecord(pId:string): Promise<boolean>

}

class TripOffertService implements ITripOffertService {

  async validate(data: any) {
    const dataValidate = modelTripOffert.build(data)
    await dataValidate.validate()
  }

  async show(pId: number): Promise<ITripOffertInstance | null> {
    try {
      const vResponse: ITripOffertInstance | null = await modelTripOffert.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  public async all(pParam: any): Promise<IResponseAllTripOffert | ITripOffertInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name','TripOffert'
      )

      const vResponse: ITripOffertInstance[] = await modelTripOffert.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllTripOffert = await fxReponseServices(
          pParam,
          whereStatement,
          'TripOffert',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: ITripOffertInput): Promise<ITripOffertInstance> {
    const vResponse: ITripOffertInstance = await modelTripOffert.create(pData)
    return vResponse
  }

  async update(pData: ITripOffertInput): Promise<ITripOffertInstance | null> {
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
      const vItem: ITripOffertInstance | null = await modelTripOffert.findOne(whereStatement)
      await vItem?.update(pData)
      return vItem
    }
    return null
  }
  async softDeleteRecord(pId: string) {
    try {
      const record = await modelTripOffert.update({ deletedAt: new Date() }, {
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

export default new TripOffertService()

