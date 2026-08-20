import type { IResponseAll } from './generalType'
import type { IStoreProductModifierGroupInstance } from '../models/Store/StoreProductModifierGroupModel'

export interface IStoreProductModifierInput {
  id?: number
  name: string
  extraPrice: number
}

export interface IStoreProductModifierGroupInput {
  id?: number
  productId: number
  name: string
  required: boolean
  minSelections: number
  maxSelections?: number | null
  modifiers?: IStoreProductModifierInput[]
}

export interface IResponseAllStoreProductModifierGroup extends IResponseAll {
  total: number
  totalPage: number
  data: IStoreProductModifierGroupInstance[]
  actualPage: number
}
