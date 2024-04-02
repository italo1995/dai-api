import type { IPaymentMethodInstance } from '../models/payments/PaymentMethodModel'
import type { IBankInstance, EAccountType } from '../models/payments/BankModel'
import type { IBranchInstance } from '../models/payments/BranchModel'

import type { IResponseAll } from './generalType'

export interface ITripInput {
  id: string
  name?: string
  fullName: string
  dni?: string
  image: string
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

export interface IBankInput {
  id: string
  name: string
  icon?: string
  phoneNumber?: string
  accountNumber?: string
  currencyId?: string
  fullName: string
  dni: string
  accountType: EAccountType
  email?: string
}

export interface IResponseAllBank extends IResponseAll {
  total: number
  totalPage: number
  data: IBankInstance[]
  actualPage: number
}
export interface IBranchInput {
  id: string
  name: string
  number: string
  email?: string
  direction: string
  lat?: string
  lon?: string
  image?: string
  referencePoint?: string
}

export interface IResponseAllBranch extends IResponseAll {
  total: number
  totalPage: number
  data: IBranchInstance[]
  actualPage: number
}
