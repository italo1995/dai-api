import type { IResponseAll } from './generalType'
import type { IStoreProductInstance } from '../models/Store/StoreProductModel'

export interface IStoreProductInput {
  id?: number
  storeId: number
  name: string
  description?: string
  price: number
  // precio promocional - mandar null para borrarlo (vuelve a regir price)
  promoPrice?: number | null
  // opcional - si no se manda, la promo queda activa hasta que se borre promoPrice a mano
  promoEndsAt?: Date | null
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
  promoPrice?: number | null
  promoEndsAt?: Date | null
  // price, o promoPrice si hay una promo activa y no vencida - lo que hay que MOSTRAR/COBRAR
  finalPrice: number
  isPromoActive: boolean
  currencyId?: number | null
  // moneda en la que esta expresado 'price'/'promoPrice'/'finalPrice', ya resuelta (mismo
  // patron que 'currency' en cart/show) - se deja tambien currencyId por compatibilidad, pero
  // usar este objeto evita que la app tenga que resolver el id a mano contra currency/all
  currency?: { id: number; name: string; symbol: string } | null
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
