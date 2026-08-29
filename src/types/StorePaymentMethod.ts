import type { IResponseAll } from './generalType'
import type { EStorePaymentMethodType, IStorePaymentMethodInstance } from '../models/Store/StorePaymentMethodModel'

export interface IStorePaymentMethodInput {
  id?: number
  storeId: number
  type: EStorePaymentMethodType
  label?: string | null
  currencyId?: number | null
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface IResponseAllStorePaymentMethod extends IResponseAll {
  total: number
  totalPage: number
  data: IStorePaymentMethodInstance[]
  actualPage: number
}
