import type { IResponseAll } from './generalType'
import type { ETypeStore, IStoreInstance } from '../models/Store/StoreModel'

export interface IStoreInput {
  id?: number
  name: string
  type: ETypeStore
  ownerId: string
  phoneCode?: string
  phoneNumber?: string
  logo?: string
  lat?: number
  lon?: number
  cityId?: number
  regionId?: number
  countryId?: number
  isOpen?: boolean
  avgPrepTimeMinutes?: number
  businessCategoryIds?: number[]
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

// Payload del endpoint publico que usa la app para listar comercios
export interface IStorePublic {
  id: number
  name: string
  type: ETypeStore
  logo?: string | null
  lat?: number | null
  lon?: number | null
  cityId?: number | null
  isOpen?: boolean
  avgPrepTimeMinutes?: number | null
  avgRating?: number
  ratingCount?: number
  businessCategories?: { id: number; name: string }[]
  // Solo viene si quien pregunta esta logueado (ver StoreController). Sin sesion, esta clave ni
  // siquiera aparece en la respuesta.
  isFavorite?: boolean
}

export interface IStoreApprovalInput {
  id: number
  rejectionReason?: string
}

export interface IResponseAllStore extends IResponseAll {
  total: number
  totalPage: number
  data: IStoreInstance[]
  actualPage: number
}

export interface IResponseAllStorePublic extends IResponseAll {
  total: number
  totalPage: number
  data: IStorePublic[]
  actualPage: number
}
