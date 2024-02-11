/* 
- File: TripDeliveryService.ts

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
import { modelTripTravel as modelTripDelivery } from '../../models'
import type { ITripDeliveryInstance } from '../../models/trip/TripDeliveryModel'
import type { ITripDeliveryInput } from '../../types/TripType'

interface ITripDeliveryService {
  validate(data: any): any
  create(payload: ITripDeliveryInput): Promise<ITripDeliveryInstance>
  update(payload: ITripDeliveryInput): Promise<ITripDeliveryInstance | null>
  destroy(id: string): Promise<number>
}

class TripDeliveryService implements ITripDeliveryService {

  async validate(data: any) {
    const dataValidate = modelTripDelivery.build(data)
    await dataValidate.validate()
  }
  async create(pData: ITripDeliveryInput): Promise<ITripDeliveryInstance> {
    const vResponse: ITripDeliveryInstance = await modelTripDelivery.create(pData)
    return vResponse
  }

  async update(pData: ITripDeliveryInput): Promise<ITripDeliveryInstance | null> {
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
      const vItem: ITripDeliveryInstance | null = await modelTripDelivery.findOne(whereStatement)
      await vItem?.update(pData)
      return vItem
    }
    return null
  }
  async destroy(id: string): Promise<number> {
    try {
      const result: number = await modelTripDelivery.destroy({
        where: { id: id }
      })
      return result
    } catch (error) {
      console.error(error)
      throw error
    }
  }
  
}
export default new TripDeliveryService()

