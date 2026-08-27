import type { IResponseAll } from './generalType'
import type { IStoreCurrencyInstance } from '../models/Store/StoreCurrencyModel'

export interface IStoreCurrencyInput {
  id?: number
  storeId: number
  currencyId: number
  exchangeRate: number
  isDefault?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IResponseAllStoreCurrency extends IResponseAll {
  total: number
  totalPage: number
  data: IStoreCurrencyInstance[]
  actualPage: number
}
