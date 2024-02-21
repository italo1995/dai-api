import type { ICurrencyInstance } from '../models/CurrencyModel'
import type { IResponseAll } from './generalType'

export interface ITripInput {
  id?: string
  name: string
  symbol: string
  change: number
  type: boolean
  auto?: string
  tripId: string
}

export interface IResponseAllTrip extends IResponseAll {
  total: number
  totalPage: number
  data: ICurrencyInstance[]
  actualPage: number
}