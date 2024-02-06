import type { IPaymentMethodInstance } from '../models/PaymentMethodModel'
import type { IResponseAll } from './generalType'

export interface ITripInput {
  id?: string
  name: string
  symbol: string
  change: number
  type: boolean
  auto?: string
}

export interface IResponseAllTrip extends IResponseAll {
  total: number
  totalPage: number
  data: IPaymentMethodInstance[]
  actualPage: number
}