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

export interface IApplyCouponInput {
  code: string
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
  // moneda en la que estan expresados total/discount/grandTotal - se toma de los productos del
  // carrito (todos los productos de una tienda comparten moneda en la practica). null si el
  // carrito esta vacio (todavia no hay de donde tomarla)
  currency: {
    id: number
    name: string
    symbol: string
  } | null
  items: ICartItemPublic[]
  // suma de los subtotales de los items disponibles (los no disponibles no se cuentan)
  total: number
  // cupon actualmente aplicado, o null si no hay ninguno - se mantiene visible aunque ya no se
  // pueda aplicar (ver couponError), para que la app pueda mostrar por que se dejo de descontar
  coupon: {
    id: number
    code: string
    type: 'percentage' | 'fixed'
    value: number
  } | null
  // monto descontado por el cupon (0 si no hay cupon o no se puede aplicar ahora mismo)
  discount: number
  // solo presente si hay un cupon aplicado pero no se puede usar en este momento (vencido,
  // inactivo, agoto su limite de usos, o el total no alcanza el minimo de compra)
  couponError?: string
  // total - discount
  grandTotal: number
}
