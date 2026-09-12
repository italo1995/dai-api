/*
- File: MarketplaceOrderService.ts
- Purpose:
  [Orden 2/8] createFromCart: convertir el carrito activo del cliente en un pedido real. Reusa
  todo el calculo de CartService.show() pero CONGELA el resultado en
  marketplace_orders/_items/_item_modifiers, descuenta inventario, incrementa times_sold, gasta
  el cupon y vacia el carrito - todo en una transaccion.
  [Orden 3/8] confirm: el comercio confirma el pedido y fija prepTimeMinutes. Calcula readyAt y
  dispatchAt segun la regla de negocio (<20 min = despacho inmediato, >=20 = diferido 15 min
  antes de readyAt). Avisa al cliente. NO crea el viaje ni busca conductor - eso lo hacen las
  tareas 4/8 (scheduler) y 5/8 (asignacion), que leen dispatchAt/status de aca.
*/
import type { FindOptions } from 'sequelize'
import sequelize, {
  modelCart,
  modelCartItem,
  modelCartItemModifier,
  modelCoupon,
  modelMarketplaceOrder,
  modelMarketplaceOrderItem,
  modelMarketplaceOrderItemModifier,
  modelStore,
  modelStorePaymentMethod,
  modelStoreProduct,
  modelTrip,
  modelUser,
} from '../../models'
import {
  EMarketplaceOrderStatus,
  EMarketplaceOrderVehicle,
  type IMarketplaceOrderInstance,
} from '../../models/Marketplace/MarketplaceOrderModel'
import { EStatusTrip } from '../../models/Trip/TripModel'
import { EStatusDriver } from '../../models/User/UserModel'
import { ETypeUser } from '../../types/User'
import { fxPaginate, fxReponseServices } from '../../utils/query'
import { moveImages } from '../../utils/helpers'
import ClassCartService from '../Cart/CartService'
import ClassUserService from '../User/UserService'
import ClassAuthService from '../User/AuthService'
import NotificationService from '../../controller/fcmPushController'
import { SocketService } from '../../ws'
import { PushMessages } from '../../constants/pushMessages'

// Quien pide un listado / detalle - se usa para el scoping por rol ([Orden 8/8]).
export interface IOrderRequester {
  id: string
  rolId: number
  typeUser: string
}

// Regla de negocio (ARQUITECTURA_MARKETPLACE.md seccion 3): si el pedido tarda menos de este
// umbral en prepararse, se despacha de una; si tarda mas, la busqueda de conductor se difiere
// para arrancar DISPATCH_LEAD_MINUTES antes de que este listo.
const IMMEDIATE_DISPATCH_THRESHOLD_MIN = 20
const DISPATCH_LEAD_MINUTES = 15
const MAX_PREP_TIME_MIN = 60

export class MarketplaceOrderError extends Error {
  code: number
  constructor(message: string, code = 400) {
    super(message)
    this.name = 'MarketplaceOrderError'
    this.code = code
  }
}

interface ICreateOrderInput {
  deliveryLat: number
  deliveryLon: number
  deliveryAddress?: string | null
  vehicle: EMarketplaceOrderVehicle
  paymentMethodId: number
  referencePointText?: string | null
  referencePhoto?: string | null
}

class MarketplaceOrderService {
  async createFromCart(pUserId: string, pDelivery: ICreateOrderInput): Promise<IMarketplaceOrderInstance> {
    const vLat = Number(pDelivery?.deliveryLat)
    const vLon = Number(pDelivery?.deliveryLon)
    if (!Number.isFinite(vLat) || !Number.isFinite(vLon)) {
      throw new MarketplaceOrderError('Falta la ubicacion de entrega (deliveryLat / deliveryLon)')
    }

    const vVehicle = pDelivery?.vehicle
    if (!Object.values(EMarketplaceOrderVehicle).includes(vVehicle as EMarketplaceOrderVehicle)) {
      throw new MarketplaceOrderError(`vehicle debe ser uno de: ${Object.values(EMarketplaceOrderVehicle).join(', ')}`)
    }
    const vPaymentMethodId = Number(pDelivery?.paymentMethodId)
    if (!vPaymentMethodId) {
      throw new MarketplaceOrderError('paymentMethod es requerido')
    }

    const vCart = await ClassCartService.show(pUserId)

    if (!vCart.items.length || !vCart.storeId) {
      throw new MarketplaceOrderError('Tu carrito esta vacio')
    }

    const vPaymentMethod = await modelStorePaymentMethod.findOne({
      where: { id: vPaymentMethodId, storeId: vCart.storeId, isActive: true },
    })
    if (!vPaymentMethod) {
      throw new MarketplaceOrderError('Ese metodo de pago no existe para esta tienda')
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

    const vReferencePhoto =
      pDelivery?.referencePhoto && pDelivery.referencePhoto.includes('temp')
        ? await moveImages(pDelivery.referencePhoto)
        : pDelivery?.referencePhoto ?? null

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
          deliveryLat: vLat,
          deliveryLon: vLon,
          deliveryAddress: pDelivery?.deliveryAddress ?? null,
          vehicle: vVehicle as EMarketplaceOrderVehicle,
          paymentMethodId: vPaymentMethod.dataValues.id,
          referencePointText: pDelivery?.referencePointText ?? null,
          referencePhoto: vReferencePhoto,
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
            ...PushMessages.nuevoPedidoParaConfirmar(),
            data: JSON.stringify({ orderId: vOrder.dataValues.id }),
          })
        }
      }
    } catch (error) {
      console.log('MarketplaceOrderService.createFromCart: fallo el push al comercio', error)
    }

    return this.showById(vOrder.dataValues.id)
  }

  // [Orden 3/8] El comercio confirma el pedido y fija el tiempo de preparacion. pRolId permite
  // que un admin/operador (rolId 1/2) confirme en nombre del comercio; un dueño (rolId 4) solo
  // puede confirmar pedidos de SU tienda.
  async confirm(
    pUserId: string,
    pRolId: number,
    pData: { orderId: number; prepTimeMinutes: number }
  ): Promise<IMarketplaceOrderInstance> {
    if (!pData?.orderId) {
      throw new MarketplaceOrderError('orderId es requerido')
    }
    const vPrep = Number(pData.prepTimeMinutes)
    if (!Number.isInteger(vPrep) || vPrep < 0 || vPrep > MAX_PREP_TIME_MIN) {
      throw new MarketplaceOrderError(
        `prepTimeMinutes debe ser un entero entre 0 y ${MAX_PREP_TIME_MIN}`
      )
    }

    const vOrder = await modelMarketplaceOrder.findByPk(pData.orderId)
    if (!vOrder) {
      throw new MarketplaceOrderError('El pedido no existe', 404)
    }
    if (vOrder.dataValues.status !== EMarketplaceOrderStatus.PENDIENTE_CONFIRMACION) {
      throw new MarketplaceOrderError(
        `El pedido no esta pendiente de confirmacion (estado actual: ${vOrder.dataValues.status})`,
        409
      )
    }

    const vIsPlatformStaff = pRolId === 1 || pRolId === 2
    if (!vIsPlatformStaff) {
      const vStore = await modelStore.findByPk(vOrder.dataValues.storeId)
      if (!vStore || vStore.dataValues.ownerId !== pUserId) {
        throw new MarketplaceOrderError('No puedes confirmar pedidos de otra tienda', 403)
      }
    }

    const vNow = new Date()
    const vReadyAt = new Date(vNow.getTime() + vPrep * 60 * 1000)
    // <20 min -> despacho inmediato (dispatchAt = ahora). >=20 -> diferido: arrancar la busqueda
    // DISPATCH_LEAD_MINUTES antes de que este listo. El scheduler (4/8) mira status=PREPARANDO +
    // dispatchAt<=now; para el caso inmediato, 5/8 disparara la asignacion directo desde aca.
    const vDispatchAt =
      vPrep < IMMEDIATE_DISPATCH_THRESHOLD_MIN
        ? vNow
        : new Date(vReadyAt.getTime() - DISPATCH_LEAD_MINUTES * 60 * 1000)

    await vOrder.update({
      status: EMarketplaceOrderStatus.PREPARANDO,
      prepTimeMinutes: vPrep,
      readyAt: vReadyAt,
      dispatchAt: vDispatchAt,
    })

    try {
      const vCustomer = await ClassUserService.show({ id: vOrder.dataValues.customerId })
      if (vCustomer?.dataValues.socketId) {
        SocketService.io.to(vCustomer.dataValues.socketId).emit('marketplaceOrderStatusUpdate', {
          orderId: vOrder.dataValues.id,
          status: EMarketplaceOrderStatus.PREPARANDO,
          tripId: null,
          driver: null,
          trip: null,
        })
      }
      if (vCustomer?.dataValues.tokenPush) {
        await NotificationService.sendNotification([vCustomer.dataValues.tokenPush], {
          ...PushMessages.pedidoConfirmado(vPrep),
          data: JSON.stringify({ orderId: vOrder.dataValues.id }),
        })
      }
    } catch (error) {
      console.log('MarketplaceOrderService.confirm: fallo avisando al cliente', error)
    }

    return this.showById(vOrder.dataValues.id)
  }

  // [Orden 7/8] Cancelacion por el COMERCIO (el cliente no puede - definido en el PDF de
  // requerimientos). Un dueño (rolId 4) solo cancela pedidos de su tienda; admin/operador
  // (1/2) cualquiera. Se permite hasta CONDUCTOR_ASIGNADO inclusive - una vez que el repartidor
  // recogio el pedido (PEDIDO_RECOGIDO) ya no. Revierte inventario, contador de ventas y uso de
  // cupon; anula el viaje y libera al repartidor si habia; avisa al cliente (y al repartidor si
  // estaba asignado).
  async cancel(
    pUserId: string,
    pRolId: number,
    pData: { orderId: number; reason?: string | null }
  ): Promise<IMarketplaceOrderInstance> {
    if (!pData?.orderId) {
      throw new MarketplaceOrderError('orderId es requerido')
    }
    const vOrder = await modelMarketplaceOrder.findByPk(pData.orderId, {
      include: [{ model: modelMarketplaceOrderItem, as: 'items' }],
    })
    if (!vOrder) {
      throw new MarketplaceOrderError('El pedido no existe', 404)
    }

    const vIsPlatformStaff = pRolId === 1 || pRolId === 2
    if (!vIsPlatformStaff) {
      const vStore = await modelStore.findByPk(vOrder.dataValues.storeId)
      if (!vStore || vStore.dataValues.ownerId !== pUserId) {
        throw new MarketplaceOrderError('No puedes cancelar pedidos de otra tienda', 403)
      }
    }

    const vCancellable: string[] = [
      EMarketplaceOrderStatus.PENDIENTE_CONFIRMACION,
      EMarketplaceOrderStatus.PREPARANDO,
      EMarketplaceOrderStatus.BUSCANDO_CONDUCTOR,
      EMarketplaceOrderStatus.CONDUCTOR_ASIGNADO,
    ]
    if (!vCancellable.includes(vOrder.dataValues.status)) {
      throw new MarketplaceOrderError(
        `El pedido ya no se puede cancelar (estado actual: ${vOrder.dataValues.status})`,
        409
      )
    }

    const vItems: any[] = (vOrder as any).dataValues.items ?? []
    const vTripId = vOrder.dataValues.tripId
    let vFreedDriverId: string | null = null

    await sequelize.transaction(async (pTransaction) => {
      // Revertir inventario + contador de ventas de los productos con inventario.
      for (const vItem of vItems) {
        const vProduct = await modelStoreProduct.findByPk(vItem.dataValues.productId, {
          transaction: pTransaction,
        })
        if (!vProduct) {
          continue
        }
        const vUpdate: Record<string, any> = {
          timesSold: Math.max(0, (vProduct.dataValues.timesSold ?? 0) - vItem.dataValues.quantity),
        }
        if (
          vProduct.dataValues.isInventoryable &&
          vProduct.dataValues.stockQuantity !== null &&
          vProduct.dataValues.stockQuantity !== undefined
        ) {
          vUpdate.stockQuantity = vProduct.dataValues.stockQuantity + vItem.dataValues.quantity
          // Si se habia auto-marcado no disponible al llegar a 0, ahora vuelve a haber stock.
          if (vProduct.dataValues.isAvailable === false && vUpdate.stockQuantity > 0) {
            vUpdate.isAvailable = true
          }
        }
        await vProduct.update(vUpdate, { transaction: pTransaction })
      }

      // Devolver el uso del cupon.
      if (vOrder.dataValues.couponId) {
        const vCoupon = await modelCoupon.findByPk(vOrder.dataValues.couponId, { transaction: pTransaction })
        if (vCoupon) {
          await vCoupon.update(
            { usageCount: Math.max(0, (vCoupon.dataValues.usageCount ?? 0) - 1) },
            { transaction: pTransaction }
          )
        }
      }

      // Anular el viaje si existe y todavia esta activo, y liberar al repartidor.
      if (vTripId) {
        const vTrip = await modelTrip.findByPk(vTripId, { transaction: pTransaction })
        if (
          vTrip &&
          vTrip.dataValues.status !== EStatusTrip.FINALIZADO &&
          vTrip.dataValues.status !== EStatusTrip.ANULADO &&
          vTrip.dataValues.status !== EStatusTrip.CANCELADO
        ) {
          await vTrip.update({ status: EStatusTrip.ANULADO }, { transaction: pTransaction })
          if (vTrip.dataValues.driverId) {
            vFreedDriverId = vTrip.dataValues.driverId
          }
        }
      }

      await vOrder.update(
        {
          status: EMarketplaceOrderStatus.CANCELADO,
          cancellationReason: pData.reason ?? null,
        },
        { transaction: pTransaction }
      )
    })

    // Fuera de la transaccion: liberar al repartidor y avisar (best-effort).
    if (vFreedDriverId) {
      await ClassAuthService.updateSocket({ id: vFreedDriverId, statusDriver: EStatusDriver.ACTIVE })
    }
    try {
      const vPayload = {
        orderId: vOrder.dataValues.id,
        tripId: vTripId ?? null,
        reason: pData.reason ?? null,
      }
      const vClient = await ClassAuthService.show(vOrder.dataValues.customerId)
      if (vClient?.dataValues.socketId) {
        SocketService.io.to(vClient.dataValues.socketId).emit('marketplaceOrderCancelled', vPayload)
        SocketService.io.to(vClient.dataValues.socketId).emit('marketplaceOrderStatusUpdate', {
          orderId: vOrder.dataValues.id,
          status: EMarketplaceOrderStatus.CANCELADO,
          tripId: vTripId ?? null,
          driver: null,
          trip: null,
          reason: pData.reason ?? null,
        })
      }
      if (vClient?.dataValues.tokenPush) {
        await NotificationService.sendNotification([vClient.dataValues.tokenPush], {
          ...PushMessages.pedidoCanceladoCliente(pData.reason),
          data: JSON.stringify(vPayload),
        })
      }
      if (vFreedDriverId) {
        const vDriver = await ClassAuthService.show(vFreedDriverId)
        if (vDriver?.dataValues.socketId) {
          SocketService.io.to(vDriver.dataValues.socketId).emit('marketplaceOrderCancelled', vPayload)
        }
        if (vDriver?.dataValues.tokenPush) {
          await NotificationService.sendNotification([vDriver.dataValues.tokenPush], {
            ...PushMessages.pedidoCanceladoDriver(),
            data: JSON.stringify(vPayload),
          })
        }
      }
      // Si estaba en BUSCANDO_CONDUCTOR, algunos repartidores lo tienen en pantalla sin haberlo
      // aceptado - broadcast para que lo saquen (el que no lo tenia lo ignora).
      SocketService.io.emit('marketplaceOrderTaken', { tripId: vTripId ?? null, orderId: vOrder.dataValues.id })
    } catch (error) {
      console.log('MarketplaceOrderService.cancel: fallo avisando', error)
    }

    return this.showById(vOrder.dataValues.id)
  }

  async showById(pOrderId: number): Promise<IMarketplaceOrderInstance> {
    const vOrder = await modelMarketplaceOrder.findByPk(pOrderId, {
      include: this.fxFullInclude(),
    })
    if (!vOrder) {
      throw new MarketplaceOrderError('El pedido no existe', 404)
    }
    return vOrder
  }

  private fxFullInclude() {
    return [
      {
        model: modelMarketplaceOrderItem,
        as: 'items',
        include: [{ model: modelMarketplaceOrderItemModifier, as: 'modifiers' }],
      },
      { model: modelStore, as: 'store', attributes: ['id', 'name', 'logo', 'type', 'lat', 'lon'] },
      { model: modelUser, as: 'customer', attributes: ['id', 'name', 'phoneCode', 'phoneNumber'] },
      { model: modelTrip, as: 'trip', required: false },
      { model: modelStorePaymentMethod, as: 'paymentMethod', required: false },
    ]
  }

  // [Orden 8/8] Detalle de un pedido con scoping por rol: cliente/comercio/repartidor asignado
  // ven el suyo, admin/operador cualquiera. Si no le corresponde -> 403.
  async showScoped(pOrderId: number, pReq: IOrderRequester): Promise<IMarketplaceOrderInstance> {
    const vOrder = await this.showById(pOrderId)
    if (pReq.rolId === 1 || pReq.rolId === 2) {
      return vOrder
    }
    if (vOrder.dataValues.customerId === pReq.id) {
      return vOrder
    }
    const vTripDriverId = (vOrder as any).dataValues.trip?.dataValues?.driverId
    if (vTripDriverId && vTripDriverId === pReq.id) {
      return vOrder
    }
    const vStore = await modelStore.findByPk(vOrder.dataValues.storeId)
    if (vStore?.dataValues.ownerId === pReq.id) {
      return vOrder
    }
    throw new MarketplaceOrderError('No tienes acceso a este pedido', 403)
  }

  // [Orden 8/8] Listado paginado con la vista que corresponde a quien pregunta:
  // - cliente (passenger): sus pedidos
  // - repartidor (driver): los pedidos cuyo viaje tiene asignado
  // - dueño de comercio (rolId 4): los pedidos de sus tiendas
  // - admin/operador (rolId 1/2): todos (con filtro opcional ?storeId)
  // Filtro comun opcional: ?status. Paginacion: ?pag + ?limit (mismo patron que el resto).
  async list(pParam: any, pReq: IOrderRequester): Promise<any> {
    const vWhere: any = {}
    const vInclude: any[] = this.fxFullInclude()

    const vIsStaff = pReq.rolId === 1 || pReq.rolId === 2
    if (vIsStaff) {
      if (pParam?.storeId) {
        vWhere.storeId = Number(pParam.storeId)
      }
    } else if (pReq.rolId === 4) {
      const vStoreIds = (
        await modelStore.findAll({ where: { ownerId: pReq.id }, attributes: ['id'] })
      ).map((s) => s.dataValues.id)
      vWhere.storeId = vStoreIds.length ? vStoreIds : [-1]
    } else if (pReq.typeUser === ETypeUser.driver) {
      const vTripInclude = vInclude.find((i) => i.as === 'trip')
      vTripInclude.required = true
      vTripInclude.where = { driverId: pReq.id }
    } else {
      vWhere.customerId = pReq.id
    }

    if (pParam?.status) {
      vWhere.status = pParam.status
    }

    const vStatement: FindOptions = {
      where: vWhere,
      include: vInclude,
      order: [['createdAt', 'DESC']],
    }
    fxPaginate(pParam, vStatement)

    const vRows = await modelMarketplaceOrder.findAll(vStatement)
    if (Number(pParam?.pag)) {
      return fxReponseServices(pParam, vStatement, 'MarketplaceOrder', vRows)
    }
    return vRows
  }
}

export default new MarketplaceOrderService()
