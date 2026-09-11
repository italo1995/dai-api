/*
- File: CartService.ts
- Purpose: Carrito de compra por usuario. Un carrito por userId (unico), atado a una sola tienda
  a la vez (una orden = una tienda, igual que el delivery). Los precios (producto + modificadores)
  se calculan en vivo en cada show() a partir del catalogo actual - no se guarda ningun snapshot
  aca, eso se hace recien cuando el carrito se convierta en Order (modulo futuro).
*/
import { modelCart, modelCartItem, modelCartItemModifier, modelCoupon, modelCurrency, modelStore, modelStoreProduct, modelStoreProductModifierGroup, modelStoreProductModifier } from '../../models'
import sequelize from '../../models'
import type { ICartInstance } from '../../models/Cart/CartModel'
import { ECouponType } from '../../models/Coupon/CouponModel'
import type {
  IAddCartItemInput,
  ICartItemPublic,
  ICartModifierSelection,
  ICartPublic,
  IUpdateCartItemInput,
} from '../../types/Cart'
import { fxGetProductPricing } from '../../utils/helpers'

// Error esperado (datos invalidos / conflicto de negocio) - el controller lo distingue de un
// crash real por el nombre de la clase, y responde con pCode en vez de reventar con un 500.
export class CartError extends Error {
  code: number
  constructor(message: string, code = 400) {
    super(message)
    this.name = 'CartError'
    this.code = code
  }
}

const vCartItemInclude = [
  {
    model: modelStoreProduct,
    as: 'product',
    attributes: ['id', 'name', 'image', 'price', 'promoPrice', 'promoEndsAt', 'isAvailable', 'storeId', 'currencyId'],
    include: [{ model: modelCurrency, as: 'currency', attributes: ['id', 'name', 'symbol'] }],
  },
  {
    model: modelCartItemModifier,
    as: 'modifiers',
    include: [
      {
        model: modelStoreProductModifier,
        as: 'modifier',
        attributes: ['id', 'name', 'extraPrice'],
      },
    ],
  },
]

class CartService {
  private async fxGetOrCreateCart(pUserId: string): Promise<ICartInstance> {
    const [vCart] = await modelCart.findOrCreate({
      where: { userId: pUserId },
      defaults: { userId: pUserId, storeId: null },
    })
    return vCart
  }

  // Valida que los modificadores elegidos existan para ese producto, respeten required/min/max
  // de cada grupo, y que la cantidad pedida de cada uno no pase su maxQuantity (ej: "Queso extra"
  // permite hasta 3x). Tira CartError (400) con un mensaje claro en vez de guardar datos
  // inconsistentes. Devuelve la seleccion normalizada (quantity siempre presente, default 1) para
  // que el caller no tenga que repetir la logica de default.
  private async fxValidateModifierSelection(
    pProductId: number,
    pSelections: ICartModifierSelection[]
  ): Promise<Required<ICartModifierSelection>[]> {
    const vGroups = await modelStoreProductModifierGroup.findAll({
      where: { productId: pProductId },
      include: [{ model: modelStoreProductModifier, as: 'modifiers' }],
    })
    const vModifierById = new Map<number, { name: string; maxQuantity: number }>()
    vGroups.forEach((pGroup: any) => {
      ;(pGroup.dataValues.modifiers ?? []).forEach((pModifier: any) => {
        vModifierById.set(pModifier.id, { name: pModifier.name, maxQuantity: pModifier.maxQuantity || 1 })
      })
    })
    const vNormalized: Required<ICartModifierSelection>[] = []
    for (const vSelection of pSelections) {
      const vModifier = vModifierById.get(vSelection.modifierId)
      if (!vModifier) {
        throw new CartError(`El modificador ${vSelection.modifierId} no pertenece a este producto`)
      }
      const vQuantity =
        vSelection.quantity && vSelection.quantity > 0 ? Math.floor(vSelection.quantity) : 1
      if (vQuantity > vModifier.maxQuantity) {
        throw new CartError(`"${vModifier.name}" permite como maximo ${vModifier.maxQuantity} unidad(es)`)
      }
      vNormalized.push({ modifierId: vSelection.modifierId, quantity: vQuantity })
    }
    for (const vGroup of vGroups) {
      const vGroupData: any = vGroup.dataValues
      const vGroupModifierIds = new Set((vGroupData.modifiers ?? []).map((pModifier: any) => pModifier.id))
      // El min/max de un grupo cuenta OPCIONES distintas elegidas, no unidades totales - pedir
      // 3x "Queso extra" sigue contando como 1 sola opcion elegida en su grupo.
      const vSelectedInGroup = vNormalized.filter((pSelection) => vGroupModifierIds.has(pSelection.modifierId))
      const vMinRequired = vGroupData.required ? Math.max(1, vGroupData.minSelections) : vGroupData.minSelections
      if (vSelectedInGroup.length < vMinRequired) {
        throw new CartError(`Debes elegir al menos ${vMinRequired} opción(es) de "${vGroupData.name}"`)
      }
      if (vGroupData.maxSelections && vSelectedInGroup.length > vGroupData.maxSelections) {
        throw new CartError(`Puedes elegir como máximo ${vGroupData.maxSelections} opción(es) de "${vGroupData.name}"`)
      }
    }
    return vNormalized
  }

  // Precio unitario (producto + suma de extraPrice*quantity de los modificadores elegidos) en
  // este momento - se usa tanto para el snapshot al agregar/editar como para el calculo en vivo
  // del show(), asi ambos numeros salen exactamente de la misma cuenta.
  private async fxComputeUnitPrice(pProductPrice: number, pSelections: Required<ICartModifierSelection>[]): Promise<number> {
    if (!pSelections.length) {
      return pProductPrice
    }
    const vModifiers = await modelStoreProductModifier.findAll({
      where: { id: pSelections.map((pSelection) => pSelection.modifierId) },
    })
    const vPriceById = new Map(vModifiers.map((pModifier) => [pModifier.dataValues.id, pModifier.dataValues.extraPrice || 0]))
    const vExtraPrice = pSelections.reduce(
      (pSum, pSelection) => pSum + (vPriceById.get(pSelection.modifierId) || 0) * pSelection.quantity,
      0
    )
    return pProductPrice + vExtraPrice
  }

  private async fxSetItemModifiers(pCartItemId: number, pSelections: Required<ICartModifierSelection>[]) {
    await sequelize.transaction(async (pTransaction) => {
      await modelCartItemModifier.destroy({ where: { cartItemId: pCartItemId }, transaction: pTransaction })
      if (pSelections.length) {
        await modelCartItemModifier.bulkCreate(
          pSelections.map((pSelection) => ({
            cartItemId: pCartItemId,
            modifierId: pSelection.modifierId,
            quantity: pSelection.quantity,
          })),
          { transaction: pTransaction }
        )
      }
    })
  }

  async addItem(pUserId: string, pData: IAddCartItemInput): Promise<ICartPublic> {
    const vProduct = await modelStoreProduct.findByPk(pData.productId)
    if (!vProduct) {
      throw new CartError('El producto no existe', 404)
    }
    if (vProduct.dataValues.isAvailable === false) {
      throw new CartError('Este producto no esta disponible')
    }
    const vCart = await this.fxGetOrCreateCart(pUserId)
    const vProductStoreId = vProduct.dataValues.storeId
    if (vCart.dataValues.storeId && vCart.dataValues.storeId !== vProductStoreId) {
      if (!pData.replaceStore) {
        throw new CartError('El carrito tiene productos de otra tienda', 409)
      }
      await this.fxClearCartRows(vCart.dataValues.id)
    }
    if (vCart.dataValues.storeId !== vProductStoreId) {
      await vCart.update({ storeId: vProductStoreId })
    }
    // Se valida siempre (aunque no vengan modifiers) para que un grupo required rechace el
    // alta si el cliente no eligio nada ahi - no solo cuando manda un array no vacio.
    const vSelections = await this.fxValidateModifierSelection(pData.productId, pData.modifiers ?? [])
    const { finalPrice: vProductPrice } = fxGetProductPricing(
      vProduct.dataValues.price,
      vProduct.dataValues.promoPrice,
      vProduct.dataValues.promoEndsAt
    )
    const vUnitPriceAtAdd = await this.fxComputeUnitPrice(vProductPrice, vSelections)
    const vItem = await modelCartItem.create({
      cartId: vCart.dataValues.id,
      productId: pData.productId,
      quantity: pData.quantity && pData.quantity > 0 ? pData.quantity : 1,
      notes: pData.notes ?? null,
      unitPriceAtAdd: vUnitPriceAtAdd,
    })
    if (vSelections.length) {
      await this.fxSetItemModifiers(vItem.dataValues.id, vSelections)
    }
    return this.show(pUserId)
  }

  async updateItem(pUserId: string, pData: IUpdateCartItemInput): Promise<ICartPublic> {
    const vCart = await this.fxGetOrCreateCart(pUserId)
    const vItem = await modelCartItem.findOne({
      where: { id: pData.cartItemId, cartId: vCart.dataValues.id },
    })
    if (!vItem) {
      throw new CartError('El item no existe en tu carrito', 404)
    }
    if (pData.quantity !== undefined) {
      if (pData.quantity < 1) {
        throw new CartError('La cantidad debe ser al menos 1 (para quitarlo, usa removeItem)')
      }
      await vItem.update({ quantity: pData.quantity })
    }
    if (pData.modifiers !== undefined) {
      // Idem addItem: se valida siempre que el cliente toque la seleccion, incluso si manda [].
      const vSelections = await this.fxValidateModifierSelection(vItem.dataValues.productId, pData.modifiers)
      await this.fxSetItemModifiers(vItem.dataValues.id, vSelections)
      // El cliente esta reconfirmando la seleccion ahora mismo - se retoma el snapshot del
      // precio para que priceChanged se calcule desde este momento, no desde el alta original.
      const vProduct = await modelStoreProduct.findByPk(vItem.dataValues.productId)
      if (vProduct) {
        const { finalPrice: vProductPrice } = fxGetProductPricing(
          vProduct.dataValues.price,
          vProduct.dataValues.promoPrice,
          vProduct.dataValues.promoEndsAt
        )
        const vUnitPriceAtAdd = await this.fxComputeUnitPrice(vProductPrice, vSelections)
        await vItem.update({ unitPriceAtAdd: vUnitPriceAtAdd })
      }
    }
    return this.show(pUserId)
  }

  async removeItem(pUserId: string, pCartItemId: number): Promise<ICartPublic> {
    const vCart = await this.fxGetOrCreateCart(pUserId)
    const vItem = await modelCartItem.findOne({
      where: { id: pCartItemId, cartId: vCart.dataValues.id },
    })
    if (!vItem) {
      throw new CartError('El item no existe en tu carrito', 404)
    }
    await sequelize.transaction(async (pTransaction) => {
      await modelCartItemModifier.destroy({ where: { cartItemId: pCartItemId }, transaction: pTransaction })
      await vItem.destroy({ transaction: pTransaction })
    })
    const vRemaining = await modelCartItem.count({ where: { cartId: vCart.dataValues.id } })
    if (!vRemaining) {
      await vCart.update({ storeId: null })
    }
    return this.show(pUserId)
  }

  private async fxClearCartRows(pCartId: number) {
    await sequelize.transaction(async (pTransaction) => {
      const vItemIds = (
        await modelCartItem.findAll({ where: { cartId: pCartId }, attributes: ['id'] })
      ).map((pItem) => pItem.dataValues.id)
      if (vItemIds.length) {
        await modelCartItemModifier.destroy({ where: { cartItemId: vItemIds }, transaction: pTransaction })
      }
      await modelCartItem.destroy({ where: { cartId: pCartId }, transaction: pTransaction })
    })
  }

  async clear(pUserId: string): Promise<ICartPublic> {
    const vCart = await this.fxGetOrCreateCart(pUserId)
    await this.fxClearCartRows(vCart.dataValues.id)
    await vCart.update({ storeId: null, couponId: null })
    return this.show(pUserId)
  }

  // Solo valida y guarda el codigo en el carrito - NO incrementa usageCount todavia (eso pasa
  // recien cuando el carrito se convierta en Order, para no gastar el limite de usos de alguien
  // que aplica y quita el cupon varias veces mientras arma el pedido).
  async applyCoupon(pUserId: string, pCode: string): Promise<ICartPublic> {
    const vCoupon = await modelCoupon.findOne({ where: { code: pCode.trim().toUpperCase() } })
    if (!vCoupon) {
      throw new CartError('El cupon no existe')
    }
    const vCart = await this.fxGetOrCreateCart(pUserId)
    const vCurrentTotal = (await this.show(pUserId)).total
    const vError = this.fxValidateCoupon(vCoupon.dataValues, vCurrentTotal)
    if (vError) {
      throw new CartError(vError)
    }
    await vCart.update({ couponId: vCoupon.dataValues.id })
    return this.show(pUserId)
  }

  async removeCoupon(pUserId: string): Promise<ICartPublic> {
    const vCart = await this.fxGetOrCreateCart(pUserId)
    await vCart.update({ couponId: null })
    return this.show(pUserId)
  }

  // Devuelve un mensaje de error si el cupon no se puede aplicar ahora mismo, o null si esta OK.
  // Se usa tanto al aplicar (rechaza de una) como en cada show() (para detectar que dejo de ser
  // valido despues de aplicado - vencio, se desactivo, o el carrito bajo del minimo de compra).
  private fxValidateCoupon(pCoupon: any, pCurrentTotal: number): string | null {
    if (!pCoupon.isActive) {
      return 'Este cupon ya no esta activo'
    }
    if (pCoupon.expiresAt && new Date(pCoupon.expiresAt).getTime() < Date.now()) {
      return 'Este cupon ya vencio'
    }
    if (pCoupon.usageLimit !== null && pCoupon.usageLimit !== undefined && pCoupon.usageCount >= pCoupon.usageLimit) {
      return 'Este cupon alcanzo su limite de usos'
    }
    if (pCoupon.minOrderAmount && pCurrentTotal < pCoupon.minOrderAmount) {
      return `Este cupon requiere una compra minima de ${pCoupon.minOrderAmount}`
    }
    return null
  }

  private fxComputeDiscount(pCoupon: any, pTotal: number): number {
    if (pCoupon.type === ECouponType.PERCENTAGE) {
      const vRaw = pTotal * (pCoupon.value / 100)
      return pCoupon.maxDiscount ? Math.min(vRaw, pCoupon.maxDiscount) : vRaw
    }
    // fixed - nunca descuenta mas de lo que hay
    return Math.min(pCoupon.value, pTotal)
  }

  async show(pUserId: string): Promise<ICartPublic> {
    const vCart = await this.fxGetOrCreateCart(pUserId)
    const vFullCart: any = await modelCart.findByPk(vCart.dataValues.id, {
      include: [
        { model: modelStore, as: 'store', attributes: ['id', 'name', 'logo'] },
        { model: modelCartItem, as: 'items', include: vCartItemInclude },
        { model: modelCoupon, as: 'coupon' },
      ],
    })
    // Se toma la moneda del primer item que tenga producto vigente - en la practica todo el
    // catalogo de una tienda comparte moneda, y el carrito ya es de una sola tienda a la vez.
    let vCurrency: { id: number; name: string; symbol: string } | null = null
    for (const pItem of vFullCart.dataValues.items ?? []) {
      const vCurrencyData = pItem.dataValues.product?.dataValues?.currency?.dataValues
      if (vCurrencyData) {
        vCurrency = { id: vCurrencyData.id, name: vCurrencyData.name, symbol: vCurrencyData.symbol }
        break
      }
    }
    const vItems: ICartItemPublic[] = (vFullCart.dataValues.items ?? []).map((pItem: any) => {
      const vItemData = pItem.dataValues
      const vProduct = vItemData.product?.dataValues
      const vUnavailable = !vProduct || vProduct.isAvailable === false
      const vModifiers = (vItemData.modifiers ?? [])
        .map((pModifierRow: any) => {
          const vModifierData = pModifierRow.dataValues.modifier?.dataValues
          if (!vModifierData) {
            return null
          }
          const vQuantity = pModifierRow.dataValues.quantity || 1
          return {
            id: vModifierData.id,
            name: vModifierData.name,
            extraPrice: vModifierData.extraPrice,
            quantity: vQuantity,
            subtotal: vModifierData.extraPrice * vQuantity,
          }
        })
        .filter(Boolean)
      const vExtraPrice = vModifiers.reduce((pSum: number, pModifier: any) => pSum + pModifier.subtotal, 0)
      const vProductPricing = vProduct
        ? fxGetProductPricing(vProduct.price, vProduct.promoPrice, vProduct.promoEndsAt)
        : { finalPrice: 0, isPromoActive: false }
      const vUnitPrice = vProductPricing.finalPrice + vExtraPrice
      // Se compara contra el snapshot tomado al agregar/editar la seleccion (unitPriceAtAdd) -
      // si el producto (incluyendo si entro/salio de promocion), o algun modificador cambio de
      // precio en el medio, esto lo detecta. No aplica si el producto quedo no disponible (ahi
      // no hay "precio actual" confiable).
      const vPriceChanged =
        !vUnavailable &&
        vItemData.unitPriceAtAdd !== null &&
        vItemData.unitPriceAtAdd !== undefined &&
        Math.abs(vItemData.unitPriceAtAdd - vUnitPrice) > 0.001
      return {
        id: vItemData.id,
        productId: vItemData.productId,
        product: vProduct
          ? {
              id: vProduct.id,
              name: vProduct.name,
              image: vProduct.image,
              price: vProduct.price,
              promoPrice: vProduct.promoPrice ?? null,
              isPromoActive: vProductPricing.isPromoActive,
            }
          : null,
        quantity: vItemData.quantity,
        notes: vItemData.notes,
        modifiers: vModifiers,
        unitPrice: vUnitPrice,
        subtotal: vUnitPrice * vItemData.quantity,
        unavailable: vUnavailable,
        priceChanged: vPriceChanged,
        ...(vPriceChanged ? { previousUnitPrice: vItemData.unitPriceAtAdd } : {}),
      }
    })
    const vTotal = vItems
      .filter((pItem) => !pItem.unavailable)
      .reduce((pSum, pItem) => pSum + pItem.subtotal, 0)
    const vCouponData = vFullCart.dataValues.coupon?.dataValues
    let vDiscount = 0
    let vCouponError: string | undefined
    if (vCouponData) {
      vCouponError = this.fxValidateCoupon(vCouponData, vTotal) ?? undefined
      if (!vCouponError) {
        vDiscount = this.fxComputeDiscount(vCouponData, vTotal)
      }
    }
    return {
      id: vFullCart.dataValues.id,
      storeId: vFullCart.dataValues.storeId,
      store: vFullCart.dataValues.store?.dataValues
        ? {
            id: vFullCart.dataValues.store.dataValues.id,
            name: vFullCart.dataValues.store.dataValues.name,
            logo: vFullCart.dataValues.store.dataValues.logo,
          }
        : null,
      currency: vCurrency,
      items: vItems,
      total: vTotal,
      coupon: vCouponData
        ? { id: vCouponData.id, code: vCouponData.code, type: vCouponData.type, value: vCouponData.value }
        : null,
      discount: vDiscount,
      ...(vCouponError ? { couponError: vCouponError } : {}),
      grandTotal: vTotal - vDiscount,
    }
  }
}

export default new CartService()
