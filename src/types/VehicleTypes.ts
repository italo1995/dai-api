import type { IVehicleAdditionalInstance } from '../models/Vehicle/VehicleAdditionalModels'
import type { IReponseAll } from './generalType'

export interface IVehicleAdditionalInput {
  id?: number
  name: string
}
export interface IResponseAllVehicleAdditionalType extends IReponseAll {
  total: number
  totalPage: number
  data: IVehicleAdditionalInstance[]
  actualPage: number
}