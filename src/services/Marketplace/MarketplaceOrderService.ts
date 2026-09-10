/*
- File: MarketplaceOrderService.ts
- Purpose: [Orden 2/8] Convertir el carrito activo del cliente en un pedido real. Reusa todo el
  calculo de CartService.show() (items, precios+modificadores, cupon/descuento) pero CONGELA el
  resultado en marketplace_orders/_items/_item_modifiers: si el catalogo cambia de precio
  despues, el pedido ya hecho no se toca. Ademas descuenta inventario, incrementa el contador de
  ventas, gasta el uso del cupon y vacia el carrito - todo en una sola transaccion.
*/
import sequelize, {
  modelCart,
  modelCartItem,
  modelCartItemModifier,
  modelCoupon,
  modelMarketplaceOrder,
  modelMarketplaceOrderItem,
  modelMarketplaceOrderItemModifier,
  modelStore,
  modelStoreProduct,
} from '../../models'
import { EMarketplaceOrderStatus, type IMarketplaceOrderInstance } from '../../models/Marketplace/MarketplaceOrderModel'
import ClassCartService from '../Cart/CartService'
import ClassUserService from '../User/UserService'
import NotificationService from '../../controller/fcmPushController'

export class MarketplaceOrderError extends Error {
  code: number
  constructor(message: string, code = 400) {
    super(message)
    this.name = 'MarketplaceOrderError'
    this.code = code
  }
}

class MarketplaceOrderService {
  async createFromCart(pUserId: string): Promise<IMarketplaceOrderInstance> {
    const vCart = await ClassCartService.show(pUserId)

    if (!vCart.items.length || !vCart.storeId) {
      throw new MarketplaceOrderError('Tu carrito esta vacio')
    }
    const vUnavailable = vCart.items.filter((pItem) => pItem.unavailable)
    if (vUnavailable.length) {
      throw new MarketplaceOrderError(
        'Hay productos que ya no estan disponibles - quitalos del carrito para poder pedir'
      )
    }
    if (vCart.couponError) {
      throw new MarketplaceOrderError(`El cupon ya no se puede aplicar: ${vCart.couponError}`)
    }

    // Chequeo de stock ANTES de abrir la transaccion (falla temprano con un mensaje claro).
    // Solo los productos con inventario activo (isInventoryable) tienen tope.
    const vProductIds = vCart.items.map((pItem) => pItem.productId)
    const vProducts = await modelStoreProduct.findAll({ where: { id: vProductIds } })
    const vProductById = new Map(vProducts.map((pProduct) => [pProduct.dataValues.id, pProduct]))
    for (const vItem of vCart.items) {
      const vProduct = vProductById.get(vItem.productId)
      if (!vProduct) {
        throw new MarketplaceOrderError('Uno de los productos del carrito ya no existe')
      }
      if (
        vProduct.dataValues.isInventoryable &&
        vProduct.dataValues.stockQuantity !== null &&
        vProduct.dataValues.stockQuantity !== undefined &&
        vProduct.dataValues.stockQuantity < vItem.quantity
      ) {
        throw new MarketplaceOrderError(
          `No hay stock suficiente de "${vProduct.dataValues.name}" (quedan ${vProduct.dataValues.stockQuantity})`
        )
      }
    }

    const vOrder = await sequelize.transaction(async (pTransaction) => {
      const vNewOrder = await modelMarketplaceOrder.create(
        {
          storeId: vCart.storeId as number,
          customerId: pUserId,
          status: EMarketplaceOrderStatus.PENDIENTE_CONFIRMACION,
          currencyId: vCart.currency?.id ?? null,
          couponId: vCart.coupon?.id ?? null,
          discount: vCart.discount,
          deliveryFee: 0,
        },
        { transaction: pTransaction }
      )

      for (const vItem of vCart.items) {
        const vOrderItem = await modelMarketplaceOrderItem.create(
          {
            orderId: vNewOrder.dataValues.id,
            productId: vItem.productId,
            productName: vItem.product?.name ?? 'Producto',
            quantity: vItem.quantity,
            unitPrice: vItem.unitPrice,
            subtotal: vItem.subtotal,
            notes: vItem.notes ?? null,
          },
          { transaction: pTransaction }
        )
        if (vItem.modifiers.length) {
          await modelMarketplaceOrderItemModifier.bulkCreate(
            vItem.modifiers.map((pModifier) => ({
              orderItemId: vOrderItem.dataValues.id,
              modifierId: pModifier.id,
              name: pModifier.name,
              extraPrice: pModifier.extraPrice,
              quantity: pModifier.quantity,
            })),
            { transaction: pTransaction }
          )
        }

        const vProduct = vProductById.get(vItem.productId)!
        const vUpdate: Record<string, any> = {
          timesSold: (vProduct.dataValues.timesSold ?? 0) + vItem.quantity,
        }
        if (
          vProduct.dataValues.isInventoryable &&
          vProduct.dataValues.stockQuantity !== null &&
          vProduct.dataValues.stockQuantity !== undefined
        ) {
          const vRemaining = vProduct.dataValues.stockQuantity - vItem.quantity
          vUpdate.stockQuantity = vRemaining
          if (vRemaining <= 0) {
            vUpdate.isAvailable = false
          }
        }
        await vProduct.update(vUpdate, { transaction: pTransaction })
      }

      if (vCart.coupon?.id) {
        const vCoupon = await modelCoupon.findByPk(vCart.coupon.id, { transaction: pTransaction })
        if (vCoupon) {
          await vCoupon.update(
            { usageCount: (vCoupon.dataValues.usageCount ?? 0) + 1 },
            { transaction: pTransaction }
          )
        }
      }

      // Vaciar el carrito dentro de la misma transaccion (mismo efecto que CartService.clear()).
      const vItemIds = (
        await modelCartItem.findAll({
          where: { cartId: vCart.id },
          attributes: ['id'],
          transaction: pTransaction,
        })
      ).map((pRow) => pRow.dataValues.id)
      if (vItemIds.length) {
        await modelCartItemModifier.destroy({
          where: { cartItemId: vItemIds },
          transaction: pTransaction,
        })
      }
      await modelCartItem.destroy({ where: { cartId: vCart.id }, transaction: pTransaction })
      await modelCart.update(
        { storeId: null, couponId: null },
        { where: { id: vCart.id }, transaction: pTransaction }
      )

      return vNewOrder
    })

    // Aviso al dueno de la tienda (fuera de la transaccion - que falle el push no debe abortar
    // un pedido ya creado). rolId=4 = 'store'; el dueno es store.ownerId.
    try {
      const vStore = await modelStore.findByPk(vOrder.dataValues.storeId)
      if (vStore?.dataValues.ownerId) {
        const vOwner = await ClassUserService.show({ id: vStore.dataValues.ownerId })
        if (vOwner?.dataValues.tokenPush) {
          await NotificationService.sendNotification([vOwner.dataValues.tokenPush], {
            title: 'Nuevo pedido',
            body: 'Tienes un pedido nuevo por confirmar. ¡Eso es DAI!',
            data: JSON.stringify({ orderId: vOrder.dataValues.id }),
          })
        }
      }
    } catch (error) {
      console.log('MarketplaceOrderService.createFromCart: fallo el push al comercio', error)
    }

    return this.showById(vOrder.dataValues.id)
  }

  async showById(pOrderId: number): Promise<IMarketplaceOrderInstance> {
    const vOrder = await modelMarketplaceOrder.findByPk(pOrderId, {
      include: [
        {
          model: modelMarketplaceOrderItem,
          as: 'items',
          include: [{ model: modelMarketplaceOrderItemModifier, as: 'modifiers' }],
        },
        { model: modelStore, as: 'store', attributes: ['id', 'name', 'logo'] },
      ],
    })
    if (!vOrder) {
      throw new MarketplaceOrderError('El pedido no existe', 404)
    }
    return vOrder
  }
}

export default new MarketplaceOrderService()
