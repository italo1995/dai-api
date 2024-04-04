import type { ICurrencyInstance } from '../models/payments/CurrencyModel'
import type { IResponseAll } from './generalType'

export interface ICurrencyInput {
  id?: string
  name: string
  symbol: string
  change: number
  type: boolean
  auto?: string
  icon: string
}

export interface IResponseAllCurrency extends IResponseAll {
  total: number
  totalPage: number
  data: ICurrencyInstance[]
  actualPage: number
}
