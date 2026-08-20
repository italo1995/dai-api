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
  departmentId?: number | null
  categoryIds?: number[]
  // Reemplaza toda la galeria (aparte de 'image', que sigue siendo la portada). El orden del
  // array define el orden en que se muestran.
  images?: string[]
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
  isInventoryable?: boolean
  stockQuantity?: number | null
  department?: { id: number; name: string } | null
  categories?: { id: number; name: string }[]
  modifierGroups?: {
    id: number
    name: string
    required: boolean
    minSelections: number
    maxSelections?: number | null
    modifiers: { id: number; name: string; extraPrice: number }[]
  }[]
  images?: { id: number; image: string; order: number }[]
}

export interface IResponseAllStoreProduct extends IResponseAll {
  total: number
  totalPage: number
  data: IStoreProductInstance[]
  actualPage: number
}
