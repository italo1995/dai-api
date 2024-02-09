import type { IVehicleAdditionalInstance } from '../models/Vehicle/VehicleAdditionalModels'
import type { IResponseAll } from './generalType'

export interface IVehicleAdditionalInput {
  id?: number
  name: string
  icon?: string
  is_moto?: boolean
  is_car?: boolean
  is_client?: boolean
  is_register?: boolean
}
export interface IResponseAllVehicleAdditionalType extends IResponseAll {
  total: number
  totalPage: number
  data: IVehicleAdditionalInstance[]
  actualPage: number
}