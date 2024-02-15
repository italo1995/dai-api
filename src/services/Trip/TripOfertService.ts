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
import type { ITripOfertInstance } from '../../models/Trip/TripOfertModel'
import type { ITripOfertInput } from '../../types/TripType'

interface ITripOfertService {
  validate(data: any): any
  create(payload: ITripOfertInput): Promise<ITripOfertInstance>
  update(payload: ITripOfertInput): Promise<ITripOfertInstance | null>
  destroy(id: string): Promise<number>
}

class TripOfertService implements ITripOfertService {

  async validate(data: any) {
    const dataValidate = modelTripOfert.build(data)
    await dataValidate.validate()
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
  async destroy(id: string): Promise<number> {
    try {
      const result: number = await modelTripOfert.destroy({
        where: { id: id }
      })
      return result
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  
}
export default new TripOfertService()

