import type { IVehicleAdditionalInstance } from '../models/Vehicle/VehicleAdditionalModels'
import type { IVehicleTypeInstance } from '../models/Vehicle/VehicleTypeModels'
import type { IResponseAll } from './generalType'
import type { ETypeCarData, ICarDataInstance } from '../models/Vehicle/CarDataModel'

export interface IVehicleAdditionalInput {
  id?: number
  name: string
  icon?: string
  isMoto?: boolean
  isCar?: boolean
  isClient?: boolean
  isRegister?: boolean
}

export enum EVehicleAdditionalRol {
  PASAJERO = 1,
  CONDUCTOR = 2,
  AMBOS = 3,
  ALL = 4,
}
export interface IResponseAllVehicleAdditionalType extends IResponseAll {
  total: number
  totalPage: number
  data: IVehicleAdditionalInstance[]
  actualPage: number
}

export interface IVehicleTypeInput {
  id?: number
  name: string
  icon?: string
  isMoto?: boolean
  isCar?: boolean
}

export interface IResponseAllVehicleTypeType extends IResponseAll {
  total: number
  totalPage: number
  data: IVehicleTypeInstance[]
  actualPage: number
}

export interface ICarDataInput {
  id: string
  name: string
  icon: string
  type: ETypeCarData
  parentId: string
}

export interface IResponseAllCarData {
  total: number
  totalPage: number
  data: ICarDataInstance[]
  actualPage: number
}
