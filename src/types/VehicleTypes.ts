import type { IVehicleAdditionalInstance } from '../models/Vehicle/VehicleAdditionalModels'
import type { IResponseAll } from './generalType'

export interface IVehicleAdditionalInput {
  id?: number
  name: string
  icon?: string
  isMoto?: boolean
  isCar?: boolean
  isClient?: boolean
  isRegister?: boolean
}
export interface IResponseAllVehicleAdditionalType extends IResponseAll {
  total: number
  totalPage: number
  data: IVehicleAdditionalInstance[]
  actualPage: number
}