import type { IPaymentMethodInstance } from '../models/PaymentMethodModel'
import type { IResponseAll } from './generalType'

export interface ITripInput {
  id: string
  name?: string
  fullName: string
  dni?: string
  tax?: number
  currencyId: number
  numberAccount?: string
  accountType?: string
  email?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IResponseAllTrip extends IResponseAll {
  total: number
  totalPage: number
  data: IPaymentMethodInstance[]
  actualPage: number
}

