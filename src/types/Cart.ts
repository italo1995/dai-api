export interface IAddCartItemInput {
  productId: number
  quantity?: number
  modifierIds?: number[]
  notes?: string
  // Si el carrito ya tiene productos de otra tienda, por defecto se rechaza (409). Con
  // replaceStore=true se vacia el carrito y se agrega este item en su lugar, en un solo llamado.
  replaceStore?: boolean
}

export interface IUpdateCartItemInput {
  cartItemId: number
  quantity?: number
  modifierIds?: number[]
}

export interface IRemoveCartItemInput {
  cartItemId: number
}

export interface ICartItemModifierPublic {
  id: number
  name: string
  extraPrice: number
}

export interface ICartItemPublic {
  id: number
  productId: number
  product: {
    id: number
    name: string
    image?: string | null
    price: number
  } | null
  quantity: number
  notes?: string | null
  modifiers: ICartItemModifierPublic[]
  // precio de una unidad (producto + modificadores), calculado en vivo - no se guarda
  unitPrice: number
  subtotal: number
  // true si el producto fue borrado o quedo no disponible despues de agregarlo al carrito
  unavailable: boolean
  // true si unitPrice cambio desde que se agrego/edito la seleccion de modificadores
  priceChanged: boolean
  // solo presente si priceChanged=true - el unitPrice que tenia en ese momento
  previousUnitPrice?: number
}

export interface ICartPublic {
  id: number
  storeId: number | null
  store: {
    id: number
    name: string
    logo?: string | null
  } | null
  items: ICartItemPublic[]
  // suma de los subtotales de los items disponibles (los no disponibles no se cuentan)
  total: number
}
