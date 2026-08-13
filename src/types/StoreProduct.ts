import type { IResponseAll } from './generalType'
import type { IStoreProductInstance } from '../models/Store/StoreProductModel'

export interface IStoreProductInput {
  id?: number
  storeId: number
  name: string
  description?: string
  price: number
  currencyId?: number
  image?: string
  category?: string
  isAvailable?: boolean
  isInventoryable?: boolean
  stockQuantity?: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

// Payload del endpoint publico que usa la app para mostrar el catalogo de una tienda
export interface IStoreProductPublic {
  id: number
  name: string
  description?: string | null
  price: number
  currencyId?: number | null
  image?: string | null
  category?: string | null
  isInventoryable?: boolean
  stockQuantity?: number | null
}

export interface IResponseAllStoreProduct extends IResponseAll {
  total: number
  totalPage: number
  data: IStoreProductInstance[]
  actualPage: number
}
