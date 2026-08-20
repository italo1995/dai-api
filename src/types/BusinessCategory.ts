import type { IResponseAll } from './generalType'
import type { IBusinessCategoryInstance } from '../models/Store/BusinessCategoryModel'

export interface IBusinessCategoryInput {
  id?: number
  name: string
  type: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IResponseAllBusinessCategory extends IResponseAll {
  total: number
  totalPage: number
  data: IBusinessCategoryInstance[]
  actualPage: number
}
