import type { IResponseAll } from './generalType'
import type { IStoreCategoryInstance } from '../models/Store/StoreCategoryModel'

export interface IStoreCategoryInput {
  id?: number
  storeId: number
  name: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IResponseAllStoreCategory extends IResponseAll {
  total: number
  totalPage: number
  data: IStoreCategoryInstance[]
  actualPage: number
}
