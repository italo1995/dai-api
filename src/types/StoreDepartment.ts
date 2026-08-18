import type { IResponseAll } from './generalType'
import type { IStoreDepartmentInstance } from '../models/Store/StoreDepartmentModel'

export interface IStoreDepartmentInput {
  id?: number
  storeId: number
  name: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IResponseAllStoreDepartment extends IResponseAll {
  total: number
  totalPage: number
  data: IStoreDepartmentInstance[]
  actualPage: number
}
