/* 
- File: TripTravelService.ts

- Purpose: 

- Author: Jairo Belen

- Creation: 11/02/2024  

==========Functions Manifest==========

- TripService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { Op, type FindOptions } from 'sequelize'
import { modelTripTravel } from '../../models'
import type { ITripTravelInstance } from '../../models/Trip/TripTravelModel'
import type { ITripTravelInput } from '../../types/TripType'

interface ITripTravelService {
  validate(data: any): any
  create(payload: ITripTravelInput): Promise<ITripTravelInstance>
  update(payload: ITripTravelInput): Promise<ITripTravelInstance | null>
  destroy(id: string): Promise<number>
}

class TripTravelService implements ITripTravelService {

  async validate(data: any) {
    const dataValidate = modelTripTravel.build(data)
    await dataValidate.validate()
  }
  async create(pData: ITripTravelInput): Promise<ITripTravelInstance> {
    const vResponse: ITripTravelInstance = await modelTripTravel.create(pData)
    return vResponse
  }

  async update(pData: ITripTravelInput): Promise<ITripTravelInstance | null> {
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
      const vItem: ITripTravelInstance | null = await modelTripTravel.findOne(whereStatement)
      await vItem?.update(pData)
      return vItem
    }
    return null
  }
  async destroy(id: string): Promise<number> {
    try {
      const result: number = await modelTripTravel.destroy({
        where: { id: id }
      })
      return result
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  
}
export default new TripTravelService()

