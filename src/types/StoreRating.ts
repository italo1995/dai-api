import type { IResponseAll } from './generalType'
import type { IStoreRatingInstance } from '../models/Store/StoreRatingModel'

export interface IStoreRatingInput {
  id?: number
  storeId: number
  userId: string
  orderId?: number | null
  rating: number
  comment?: string | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IResponseAllStoreRating extends IResponseAll {
  total: number
  totalPage: number
  data: IStoreRatingInstance[]
  actualPage: number
}
