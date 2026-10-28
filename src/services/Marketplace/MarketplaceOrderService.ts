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
import { Op, type FindOptions } from 'sequelize'
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
import { ETypeStore } from '../../models/Store/StoreModel'
import { ETypeUser } from '../../types/User'
import { fxPaginate, fxReponseServices } from '../../utils/query'
import {
  moveImages,
  fxGenerateQuoteToken,
  fxVerifyQuoteToken,
  fxGetRoadDistanceKm,
  fxHaversineKm,
} from '../../utils/helpers'
import ClassCartService from '../Cart/CartService'
import ClassUserService from '../User/UserService'
import ClassAuthService from '../User/AuthService'
import ClassRangePriceService from '../Locations/RangePriceService'
import ClassCompanyParameterService from '../web/CompanyParameterService'
import NotificationService from '../../controller/fcmPushController'
import { SocketService } from '../../ws'
import { PushMessages, type IPushMessage } from '../../constants/pushMessages'
import ClassMarketplaceDispatchService from './MarketplaceDispatchService'
import ClassUserDeviceService from '../User/UserDeviceService'

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
// Radio por defecto de nearbyPending, en km - mismo valor que DISPATCH_SEARCH_RADIUS_KM en
// MarketplaceDispatchService.ts (no se importa de ahi porque es privado a ese archivo; si cambia
// uno, revisar el otro).
const DEFAULT_NEARBY_ORDERS_RADIUS_KM = 15


// Avisos en tiempo real de pedidos de tienda (campana de payaWeb): ademas del dueno de la tienda,
// los admins/operadores (rolId 1/2) reciben el mismo evento para ver pedidos de TODAS las tiendas
// en la campana global del admin sin tener que abrir el Marketplace (2026-10-23).
async function emitStoreOrderEvent(
  pOwnerSocketIds: string[],
  pPayload: { kind: string; orderId: number; storeId: number }
): Promise<void> {
  const vAdmins = await ClassUserService.allUserAdmin()
  const vAdminSocketIds = vAdmins.map((pAdmin) => pAdmin.socketId).filter(Boolean) as string[]
  const vTargets = [...new Set([...pOwnerSocketIds, ...vAdminSocketIds])]
  if (vTargets.length) {
    SocketService.io.to(vTargets).emit('storeOrderEvent', pPayload)
  }
}

export class MarketplaceOrderError extends Error {
  code: number
  constructor(message: string, code = 400) {
    super(message)
    this.name = 'MarketplaceOrderError'
    this.code = code
  }
}

interface IGetQuoteInput {
  deliveryLat: number
  deliveryLon: number
  vehicle: EMarketplaceOrderVehicle
}

// Lo que viaja firmado adentro del quoteToken - ver fxGenerateQuoteToken/fxVerifyQuoteToken.
// order/store confia en estos valores, nunca en lo que el cliente mande suelto en el body.
interface IQuoteTokenPayload {
  storeId: number
  deliveryLat: number
  deliveryLon: number
  vehicle: EMarketplaceOrderVehicle
  deliveryFee: number
  currencyId: number | null
}

interface ICreateOrderInput {
  quoteToken: string
  deliveryAddress?: string | null
  paymentMethodId: number
  referencePointText?: string | null
  referencePhoto?: string | null
}

class MarketplaceOrderService {
  // [quote] Calcula el delivery fee UNA vez con la distancia real de Google (nunca con lo que
  // mande el cliente) y lo devuelve firmado - order/store solo confia en ese token, no vuelve a
  // recalcular ni acepta un fee/vehicle/coordenadas sueltos en el body. Ver conversacion con
  // Italo 2026-09-12 (ARQUITECTURA_MARKETPLACE.md / MARKETPLACE_ENDPOINTS_APP.md seccion 2.1).
  async getQuote(pUserId: string, pInput: IGetQuoteInput) {
    const vLat = Number(pInput?.deliveryLat)
    const vLon = Number(pInput?.deliveryLon)
    if (!Number.isFinite(vLat) || !Number.isFinite(vLon)) {
      throw new MarketplaceOrderError('Falta la ubicacion de entrega (deliveryLat / deliveryLon)')
    }
    const vVehicle = pInput?.vehicle
    if (!Object.values(EMarketplaceOrderVehicle).includes(vVehicle as EMarketplaceOrderVehicle)) {
      throw new MarketplaceOrderError(`vehicle debe ser uno de: ${Object.values(EMarketplaceOrderVehicle).join(', ')}`)
    }

    const vCart = await ClassCartService.show(pUserId)
    if (!vCart.items.length || !vCart.storeId) {
      throw new MarketplaceOrderError('Tu carrito esta vacio')
    }
    if (vCart.items.some((pItem) => pItem.unavailable)) {
      throw new MarketplaceOrderError(
        'Hay productos que ya no estan disponibles - quitalos del carrito para poder pedir'
      )
    }
    if (vCart.couponError) {
      throw new MarketplaceOrderError(`El cupon ya no se puede aplicar: ${vCart.couponError}`)
    }

    const vStore = await modelStore.findByPk(vCart.storeId)
    if (!vStore?.dataValues.lat || !vStore?.dataValues.lon) {
      throw new MarketplaceOrderError('La tienda no tiene ubicacion configurada, no se puede calcular el delivery', 500)
    }

    let vDistanceKm: number
    try {
      vDistanceKm = await fxGetRoadDistanceKm(
        { lat: vStore.dataValues.lat, lon: vStore.dataValues.lon },
        { lat: vLat, lon: vLon }
      )
    } catch (error: any) {
      throw new MarketplaceOrderError(error.message || 'No se pudo calcular la distancia de entrega', 500)
    }

    // Primero busca la tarifa especifica del vehiculo elegido (Delivery Moto DAI / Delivery Carro
    // DAI - ver ETypeRangePrice) para que moto y carro puedan tener valores distintos. Si el
    // admin todavia no configuro esa version especifica, cae a la generica "Delivery DAI" (mismo
    // valor para cualquier vehiculo, como funcionaba antes) para no romper zonas ya configuradas.
    const vLoc = {
      cityId: vStore.dataValues.cityId ?? null,
      regionId: vStore.dataValues.regionId ?? null,
      countryId: vStore.dataValues.countryId ?? null,
    }
    const vRangePrice =
      (await ClassRangePriceService.showPriceToId({
        ...vLoc,
        isCar: vVehicle === EMarketplaceOrderVehicle.CAR,
        isMoto: vVehicle === EMarketplaceOrderVehicle.MOTO,
        isDelivery: true,
        isTravel: false,
      })) ||
      (await ClassRangePriceService.showPriceToId({
        ...vLoc,
        isCar: false,
        isMoto: false,
        isDelivery: true,
        isTravel: false,
      }))
    if (!vRangePrice) {
      throw new MarketplaceOrderError('No hay tarifa de delivery configurada para la zona de esta tienda', 500)
    }

    const vBaseKm = Number(vRangePrice.baseKilometer) || 0
    const vBasePrice = Number(vRangePrice.basePrice) || 0
    const vExtraKm = Number(vRangePrice.extraKilometer) || 0
    const vExtraPrice = Number(vRangePrice.extraPrice) || 0
    let vDeliveryFee = vBasePrice
    if (vDistanceKm > vBaseKm) {
      if (vExtraKm <= 0) {
        throw new MarketplaceOrderError('La tarifa de delivery de esta zona esta mal configurada (extraKilometer)', 500)
      }
      vDeliveryFee += Math.ceil((vDistanceKm - vBaseKm) / vExtraKm) * vExtraPrice
    }

    const vTokenPayload: IQuoteTokenPayload = {
      storeId: vCart.storeId,
      deliveryLat: vLat,
      deliveryLon: vLon,
      vehicle: vVehicle as EMarketplaceOrderVehicle,
      deliveryFee: vDeliveryFee,
      currencyId: vCart.currency?.id ?? null,
    }

    return {
      productsTotal: vCart.total,
      discount: vCart.discount,
      deliveryFee: vDeliveryFee,
      grandTotal: vCart.grandTotal + vDeliveryFee,
      distanceKm: Math.round(vDistanceKm * 10) / 10,
      currency: vCart.currency,
      quoteToken: fxGenerateQuoteToken(vTokenPayload),
    }
  }

  // QA Sprint 3 #2/#6, fase B: Ricardo suma el volumen de los items del carrito del lado de la
  // app y nos pregunta si esa suma entra en moto. El tope se lee de Parametros de la Empresa
  // (name: 'motoMaxVolume', ver seeder) - si no esta configurado, se permite moto sin restriccion
  // (fail-open, mismo criterio que 'percentage' en CompanyParameterService). No hay tope para
  // carro todavia porque no se pidio.
  async checkVolume(pVolume: number): Promise<{ allowed: boolean; maxVolume: number | null }> {
    const vParameter = await ClassCompanyParameterService.showByName('motoMaxVolume')
    const vMaxVolume = vParameter ? Number(vParameter.dataValues.value) : null
    if (vMaxVolume === null || !Number.isFinite(vMaxVolume)) {
      return { allowed: true, maxVolume: null }
    }
    return { allowed: pVolume <= vMaxVolume, maxVolume: vMaxVolume }
  }

  async createFromCart(pUserId: string, pDelivery: ICreateOrderInput): Promise<IMarketplaceOrderInstance> {
    const vQuote = fxVerifyQuoteToken(pDelivery?.quoteToken) as (IQuoteTokenPayload & { exp: number }) | null
    if (!vQuote) {
      throw new MarketplaceOrderError('La cotizacion expiro o no es valida - volve a cotizar el delivery')
    }

    const vPaymentMethodId = Number(pDelivery?.paymentMethodId)
    if (!vPaymentMethodId) {
      throw new MarketplaceOrderError('paymentMethod es requerido')
    }

    const vCart = await ClassCartService.show(pUserId)

    if (!vCart.items.length || !vCart.storeId) {
      throw new MarketplaceOrderError('Tu carrito esta vacio')
    }
    if (vCart.storeId !== vQuote.storeId || (vCart.currency?.id ?? null) !== vQuote.currencyId) {
      throw new MarketplaceOrderError('El carrito cambio desde que cotizaste el delivery - volve a cotizar')
    }

    const vLat = vQuote.deliveryLat
    const vLon = vQuote.deliveryLon
    const vVehicle = vQuote.vehicle

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
          deliveryFee: vQuote.deliveryFee,
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
        // Multi-dispositivo (Italo, 2026-09-21): si el dueño tiene la cuenta abierta en mas de un
        // dispositivo, les llega a TODOS - no solo al ultimo que se conecto/registro su token.
        const vOwnerPushTokens = await ClassUserDeviceService.mergePushTokens(vStore.dataValues.ownerId, vOwner?.dataValues.tokenPush)
        if (vOwnerPushTokens.length) {
          await NotificationService.sendNotification(vOwnerPushTokens, {
            ...PushMessages.nuevoPedidoParaConfirmar(),
            data: JSON.stringify({ orderId: vOrder.dataValues.id }),
          })
        }
        // Panel web de la tienda (payaWeb) - el push de arriba es solo para el celular del dueño,
        // esto es lo que permite que la lista de ordenes en el navegador se actualice sola sin que
        // alguien tenga que refrescar la pagina (ver paya_store_panel_ux_proposal.md).
        const vOwnerSocketIds = await ClassUserDeviceService.mergeSocketIds(vStore.dataValues.ownerId, vOwner?.dataValues.socketId)
        await emitStoreOrderEvent(vOwnerSocketIds, {
          kind: 'new_order',
          orderId: vOrder.dataValues.id,
          storeId: vOrder.dataValues.storeId,
        })
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

  // La tienda dice "ya esta listo" ANTES de que se cumpla prepTimeMinutes (Italo, 2026-09-18:
  // "puede ser que lo tengan listo en menos tiempo, y no esta bien que esperen ese tiempo").
  // Si todavia no se despacho (PREPARANDO), fuerza la busqueda de conductor ya mismo en vez de
  // esperar a dispatchAt. Si ya hay un conductor asignado y en camino a la tienda, solo le avisa
  // que el pedido esta listo. Si ya esta en BUSCANDO_CONDUCTOR, no hay nada que forzar (ya se
  // esta buscando) - solo queda el registro de markedReadyAt.
  async markReady(
    pUserId: string,
    pRolId: number,
    pData: { orderId: number }
  ): Promise<IMarketplaceOrderInstance> {
    if (!pData?.orderId) {
      throw new MarketplaceOrderError('orderId es requerido')
    }
    const vOrder = await modelMarketplaceOrder.findByPk(pData.orderId)
    if (!vOrder) {
      throw new MarketplaceOrderError('El pedido no existe', 404)
    }

    const vIsPlatformStaff = pRolId === 1 || pRolId === 2
    if (!vIsPlatformStaff) {
      const vStore = await modelStore.findByPk(vOrder.dataValues.storeId)
      if (!vStore || vStore.dataValues.ownerId !== pUserId) {
        throw new MarketplaceOrderError('No puedes marcar pedidos de otra tienda', 403)
      }
    }

    const vMarkableStatuses = [
      EMarketplaceOrderStatus.PREPARANDO,
      EMarketplaceOrderStatus.BUSCANDO_CONDUCTOR,
      EMarketplaceOrderStatus.CONDUCTOR_ASIGNADO,
    ]
    if (!vMarkableStatuses.includes(vOrder.dataValues.status)) {
      throw new MarketplaceOrderError(
        `Este pedido no se puede marcar como listo (estado actual: ${vOrder.dataValues.status})`,
        409
      )
    }
    if (vOrder.dataValues.markedReadyAt) {
      return this.showById(vOrder.dataValues.id)
    }

    const vNow = new Date()
    const vExistingReadyAt = vOrder.dataValues.readyAt
    await vOrder.update({
      markedReadyAt: vNow,
      // Si el tiempo estimado todavia no se cumplia, se recorta a ahora - el cronometro del
      // panel debe mostrar "listo" de inmediato, no seguir contando hasta el estimado original.
      readyAt: vExistingReadyAt && vExistingReadyAt < vNow ? vExistingReadyAt : vNow,
    })

    if (vOrder.dataValues.status === EMarketplaceOrderStatus.PREPARANDO) {
      await ClassMarketplaceDispatchService.forceDispatchIfPending(vOrder.dataValues.id)
    } else if (vOrder.dataValues.status === EMarketplaceOrderStatus.CONDUCTOR_ASIGNADO && vOrder.dataValues.tripId) {
      try {
        const vTrip = await modelTrip.findByPk(vOrder.dataValues.tripId)
        if (vTrip?.dataValues.driverId) {
          const vDriver = await ClassUserService.show({ id: vTrip.dataValues.driverId, isDriver: true })
          if (vDriver?.dataValues.tokenPush) {
            await NotificationService.sendNotification([vDriver.dataValues.tokenPush], {
              ...PushMessages.pedidoListoParaRecoger(),
              data: JSON.stringify({ orderId: vOrder.dataValues.id }),
            })
          }
        }
      } catch (error) {
        console.log('MarketplaceOrderService.markReady: fallo avisando al conductor', error)
      }
    }

    return this.showById(vOrder.dataValues.id)
  }

  // [Orden 7/8] Cancelacion por el COMERCIO (definido en el PDF de requerimientos original, antes
  // de que el cliente tuviera su propio flujo - ver cancelByClient). Un dueño (rolId 4) solo
  // cancela pedidos de su tienda; admin/operador (1/2) cualquiera. Se permite hasta
  // CONDUCTOR_ASIGNADO inclusive - una vez que el repartidor recogio el pedido (PEDIDO_RECOGIDO)
  // ya no. Un pedido en CANCELACION_SOLICITADA tampoco entra aca - la tienda tiene que resolver
  // esa solicitud con acceptCancelRequest/rejectCancelRequest, no cancelarla por este lado.
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
    const vFreedDriverId = await this.fxApplyCancellation(vOrder, vItems, pData.reason ?? null)
    await this.fxNotifyCancellation(vOrder, pData.reason ?? null, vFreedDriverId, PushMessages.pedidoCanceladoCliente(pData.reason))

    return this.showById(vOrder.dataValues.id)
  }

  // Cancelacion iniciada por el CLIENTE (pedido de los jefes de Italo, 2026-09-11): si el pedido
  // todavia no lo confirmo la tienda, no hay nada "pagado" en la practica (son metodos de pago
  // manuales, no hay pasarela) - se cancela directo, mismo efecto que cancel(). Si ya lo confirmo
  // (preparando/buscando conductor/conductor asignado), el cliente no puede cancelarlo el mismo -
  // queda en CANCELACION_SOLICITADA hasta que la tienda o un admin lo acepte o lo rechace. Desde
  // PEDIDO_RECOGIDO en adelante ya no se puede ni solicitar (mismo corte que usan apps como Uber
  // Eats/Rappi: una vez que el repartidor tiene el pedido en mano, ya no es autoservicio).
  async cancelByClient(
    pUserId: string,
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
    if (vOrder.dataValues.customerId !== pUserId) {
      throw new MarketplaceOrderError('No puedes cancelar el pedido de otro cliente', 403)
    }

    if (vOrder.dataValues.status === EMarketplaceOrderStatus.PENDIENTE_CONFIRMACION) {
      const vItems: any[] = (vOrder as any).dataValues.items ?? []
      await this.fxApplyCancellation(vOrder, vItems, pData.reason ?? null)
      try {
        const vStore = await modelStore.findByPk(vOrder.dataValues.storeId)
        if (vStore?.dataValues.ownerId) {
          const vOwner = await ClassUserService.show({ id: vStore.dataValues.ownerId })
          const vOwnerPushTokens = await ClassUserDeviceService.mergePushTokens(vStore.dataValues.ownerId, vOwner?.dataValues.tokenPush)
          if (vOwnerPushTokens.length) {
            await NotificationService.sendNotification(vOwnerPushTokens, {
              ...PushMessages.pedidoCanceladoPorClienteSinPagar(),
              data: JSON.stringify({ orderId: vOrder.dataValues.id }),
            })
          }
          const vOwnerSocketIds = await ClassUserDeviceService.mergeSocketIds(vStore.dataValues.ownerId, vOwner?.dataValues.socketId)
          await emitStoreOrderEvent(vOwnerSocketIds, {
            kind: 'cancelled_by_client',
            orderId: vOrder.dataValues.id,
            storeId: vOrder.dataValues.storeId,
          })
        }
      } catch (error) {
        console.log('MarketplaceOrderService.cancelByClient: fallo avisando a la tienda', error)
      }
      return this.showById(vOrder.dataValues.id)
    }

    const vRequestable: string[] = [
      EMarketplaceOrderStatus.PREPARANDO,
      EMarketplaceOrderStatus.BUSCANDO_CONDUCTOR,
      EMarketplaceOrderStatus.CONDUCTOR_ASIGNADO,
    ]
    if (!vRequestable.includes(vOrder.dataValues.status)) {
      throw new MarketplaceOrderError(
        `El pedido ya no se puede cancelar ni solicitar su cancelacion (estado actual: ${vOrder.dataValues.status})`,
        409
      )
    }

    const vPreviousStatus = vOrder.dataValues.status
    await vOrder.update({
      previousStatus: vPreviousStatus,
      status: EMarketplaceOrderStatus.CANCELACION_SOLICITADA,
      cancelRequestReason: pData.reason ?? null,
      cancelRequestedAt: new Date(),
    })

    try {
      const vClient = await ClassAuthService.show(pUserId)
      if (vClient?.dataValues.socketId) {
        SocketService.io.to(vClient.dataValues.socketId).emit('marketplaceOrderStatusUpdate', {
          orderId: vOrder.dataValues.id,
          status: EMarketplaceOrderStatus.CANCELACION_SOLICITADA,
          tripId: vOrder.dataValues.tripId ?? null,
          driver: null,
          trip: null,
        })
      }
      const vRecipients: string[] = []
      const vStore = await modelStore.findByPk(vOrder.dataValues.storeId)
      if (vStore?.dataValues.ownerId) {
        const vOwner = await ClassUserService.show({ id: vStore.dataValues.ownerId })
        const vOwnerPushTokens = await ClassUserDeviceService.mergePushTokens(vStore.dataValues.ownerId, vOwner?.dataValues.tokenPush)
        vRecipients.push(...vOwnerPushTokens)
        const vOwnerSocketIds = await ClassUserDeviceService.mergeSocketIds(vStore.dataValues.ownerId, vOwner?.dataValues.socketId)
        await emitStoreOrderEvent(vOwnerSocketIds, {
          kind: 'cancel_request',
          orderId: vOrder.dataValues.id,
          storeId: vOrder.dataValues.storeId,
        })
      }
      const vAdmins = await ClassUserService.allUserAdmin()
      vRecipients.push(...vAdmins.map((pAdmin: any) => pAdmin.tokenPush).filter(Boolean))
      if (vRecipients.length) {
        await NotificationService.sendNotification(vRecipients, {
          ...PushMessages.solicitudCancelacionRecibida(),
          data: JSON.stringify({ orderId: vOrder.dataValues.id }),
        })
      }
    } catch (error) {
      console.log('MarketplaceOrderService.cancelByClient: fallo avisando la solicitud', error)
    }

    return this.showById(vOrder.dataValues.id)
  }

  // La tienda (dueño de esa tienda, o admin/operador) acepta la solicitud de cancelacion del
  // cliente: mismo efecto que cancel() (revierte inventario/cupon, anula viaje, libera
  // repartidor), pero el motivo que queda registrado es el que dio el CLIENTE al pedirla, y el
  // aviso al cliente es distinto (le avisa que van a coordinar el reembolso, no que "la tienda
  // canceló tu pedido" sin mas contexto).
  async acceptCancelRequest(pUserId: string, pRolId: number, pData: { orderId: number }): Promise<IMarketplaceOrderInstance> {
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
        throw new MarketplaceOrderError('No puedes resolver solicitudes de otra tienda', 403)
      }
    }
    if (vOrder.dataValues.status !== EMarketplaceOrderStatus.CANCELACION_SOLICITADA) {
      throw new MarketplaceOrderError(
        `Este pedido no tiene una solicitud de cancelacion pendiente (estado actual: ${vOrder.dataValues.status})`,
        409
      )
    }

    const vItems: any[] = (vOrder as any).dataValues.items ?? []
    const vReason = vOrder.dataValues.cancelRequestReason ?? null
    const vFreedDriverId = await this.fxApplyCancellation(vOrder, vItems, vReason)
    await this.fxNotifyCancellation(vOrder, vReason, vFreedDriverId, PushMessages.solicitudCancelacionAceptada())

    return this.showById(vOrder.dataValues.id)
  }

  // La tienda (o admin/operador) rechaza la solicitud: el pedido vuelve al estado que tenia antes
  // de que el cliente la pidiera y sigue su curso normal - no revierte nada (nunca se llego a
  // tocar inventario/cupon/viaje, la solicitud solo pauso el status).
  async rejectCancelRequest(pUserId: string, pRolId: number, pData: { orderId: number }): Promise<IMarketplaceOrderInstance> {
    if (!pData?.orderId) {
      throw new MarketplaceOrderError('orderId es requerido')
    }
    const vOrder = await modelMarketplaceOrder.findByPk(pData.orderId)
    if (!vOrder) {
      throw new MarketplaceOrderError('El pedido no existe', 404)
    }

    const vIsPlatformStaff = pRolId === 1 || pRolId === 2
    if (!vIsPlatformStaff) {
      const vStore = await modelStore.findByPk(vOrder.dataValues.storeId)
      if (!vStore || vStore.dataValues.ownerId !== pUserId) {
        throw new MarketplaceOrderError('No puedes resolver solicitudes de otra tienda', 403)
      }
    }
    if (vOrder.dataValues.status !== EMarketplaceOrderStatus.CANCELACION_SOLICITADA) {
      throw new MarketplaceOrderError(
        `Este pedido no tiene una solicitud de cancelacion pendiente (estado actual: ${vOrder.dataValues.status})`,
        409
      )
    }

    const vRestoredStatus = (vOrder.dataValues.previousStatus as EMarketplaceOrderStatus) || EMarketplaceOrderStatus.PREPARANDO
    await vOrder.update({ status: vRestoredStatus, previousStatus: null })

    try {
      const vClient = await ClassAuthService.show(vOrder.dataValues.customerId)
      if (vClient?.dataValues.socketId) {
        SocketService.io.to(vClient.dataValues.socketId).emit('marketplaceOrderStatusUpdate', {
          orderId: vOrder.dataValues.id,
          status: vRestoredStatus,
          tripId: vOrder.dataValues.tripId ?? null,
          driver: null,
          trip: null,
        })
      }
      if (vClient?.dataValues.tokenPush) {
        await NotificationService.sendNotification([vClient.dataValues.tokenPush], {
          ...PushMessages.solicitudCancelacionRechazada(),
          data: JSON.stringify({ orderId: vOrder.dataValues.id }),
        })
      }
    } catch (error) {
      console.log('MarketplaceOrderService.rejectCancelRequest: fallo avisando al cliente', error)
    }

    return this.showById(vOrder.dataValues.id)
  }

  // Logica compartida entre cancel() y acceptCancelRequest(): revierte inventario/timesSold de
  // los productos del pedido, devuelve el uso del cupon, anula el viaje si existia y libera al
  // repartidor asignado. Deja el pedido en CANCELADO. Devuelve el driverId liberado (o null) para
  // que el llamador avise fuera de la transaccion.
  private async fxApplyCancellation(
    pOrder: IMarketplaceOrderInstance,
    pItems: any[],
    pReason: string | null
  ): Promise<string | null> {
    const vTripId = pOrder.dataValues.tripId
    let vFreedDriverId: string | null = null

    await sequelize.transaction(async (pTransaction) => {
      for (const vItem of pItems) {
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
          if (vProduct.dataValues.isAvailable === false && vUpdate.stockQuantity > 0) {
            vUpdate.isAvailable = true
          }
        }
        await vProduct.update(vUpdate, { transaction: pTransaction })
      }

      if (pOrder.dataValues.couponId) {
        const vCoupon = await modelCoupon.findByPk(pOrder.dataValues.couponId, { transaction: pTransaction })
        if (vCoupon) {
          await vCoupon.update(
            { usageCount: Math.max(0, (vCoupon.dataValues.usageCount ?? 0) - 1) },
            { transaction: pTransaction }
          )
        }
      }

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

      await pOrder.update(
        {
          status: EMarketplaceOrderStatus.CANCELADO,
          cancellationReason: pReason,
          previousStatus: null,
        },
        { transaction: pTransaction }
      )
    })

    if (vFreedDriverId) {
      await ClassAuthService.updateSocket({ id: vFreedDriverId, statusDriver: EStatusDriver.ACTIVE })
    }
    return vFreedDriverId
  }

  // Avisos post-cancelacion compartidos entre cancel() y acceptCancelRequest() - lo unico que
  // cambia entre esos dos casos es el mensaje que recibe el cliente.
  private async fxNotifyCancellation(
    pOrder: IMarketplaceOrderInstance,
    pReason: string | null,
    pFreedDriverId: string | null,
    pClientMessage: IPushMessage
  ): Promise<void> {
    try {
      const vPayload = {
        orderId: pOrder.dataValues.id,
        tripId: pOrder.dataValues.tripId ?? null,
        reason: pReason,
      }
      const vClient = await ClassAuthService.show(pOrder.dataValues.customerId)
      if (vClient?.dataValues.socketId) {
        SocketService.io.to(vClient.dataValues.socketId).emit('marketplaceOrderCancelled', vPayload)
        SocketService.io.to(vClient.dataValues.socketId).emit('marketplaceOrderStatusUpdate', {
          orderId: pOrder.dataValues.id,
          status: EMarketplaceOrderStatus.CANCELADO,
          tripId: pOrder.dataValues.tripId ?? null,
          driver: null,
          trip: null,
          reason: pReason,
        })
      }
      if (vClient?.dataValues.tokenPush) {
        await NotificationService.sendNotification([vClient.dataValues.tokenPush], {
          ...pClientMessage,
          data: JSON.stringify(vPayload),
        })
      }
      if (pFreedDriverId) {
        const vDriver = await ClassAuthService.show(pFreedDriverId)
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
      SocketService.io.emit('marketplaceOrderTaken', { tripId: pOrder.dataValues.tripId ?? null, orderId: pOrder.dataValues.id })
    } catch (error) {
      console.log('MarketplaceOrderService: fallo avisando la cancelacion', error)
    }
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

    // Prioridad clara (Italo, 2026-09-18): un pedido esperando confirmacion o con una solicitud
    // de cancelacion sin resolver necesita atencion YA, sin importar que haya pedidos mas
    // recientes despues - flotan arriba de la lista completa (no solo dentro de la pagina
    // actual, por eso el ordenamiento va en la query y no en el cliente). Dentro de cada grupo
    // de prioridad, el mas reciente sigue arriba.
    const vPriorityStatuses = [
      EMarketplaceOrderStatus.PENDIENTE_CONFIRMACION,
      EMarketplaceOrderStatus.CANCELACION_SOLICITADA,
    ]
    // "status" a secas es ambiguo con join de por medio - el include trae "trip" (tabla trips),
    // que tambien tiene su propia columna status (EStatusTrip). Hay que calificarla con la tabla.
    const vPriorityCase = `CASE WHEN "MarketplaceOrder"."status" IN (${vPriorityStatuses.map((s) => `'${s}'`).join(', ')}) THEN 0 ELSE 1 END`

    const vStatement: FindOptions = {
      where: vWhere,
      include: vInclude,
      order: [[sequelize.literal(vPriorityCase), 'ASC'], ['createdAt', 'DESC']],
    }
    fxPaginate(pParam, vStatement)

    const vRows = await modelMarketplaceOrder.findAll(vStatement)
    if (Number(pParam?.pag)) {
      return fxReponseServices(pParam, vStatement, 'MarketplaceOrder', vRows)
    }
    return vRows
  }

  // Respaldo "pull" para cuando el aviso "newMarketplaceOrder" no le llega al repartidor por
  // socket (reconexion, push perdido, app recien abierta, etc) - el conductor puede preguntar el
  // mismo directamente "hay algo para mi cerca de aca" en vez de esperar a que le empujen algo.
  // Usa EXACTAMENTE el mismo criterio de elegibilidad que el despacho automatico
  // (MarketplaceDispatchService.dispatchClaimedOrder -> UserService.NearbyDrivers) para que un
  // conductor nunca vea por acá algo que el despacho automático no le habría ofrecido: activo,
  // verificado, y habilitado (dai_food/dai_market) para el tipo de la tienda del pedido.
  async nearbyPending(
    pDriverId: string,
    pInput: { lat: number; lon: number; distance?: number | undefined }
  ): Promise<
    Array<{ orderId: number; tripId: number; store: any; deliveryFee: number; distanceKm: number }>
  > {
    const vLat = Number(pInput?.lat)
    const vLon = Number(pInput?.lon)
    if (!Number.isFinite(vLat) || !Number.isFinite(vLon)) {
      throw new MarketplaceOrderError('Falta tu ubicacion actual (lat / lon)')
    }
    const vRadius = Number(pInput?.distance) || DEFAULT_NEARBY_ORDERS_RADIUS_KM

    const vDriver = await modelUser.findByPk(pDriverId)
    if (!vDriver) {
      throw new MarketplaceOrderError('Conductor no encontrado', 404)
    }
    if (vDriver.dataValues.typeUser !== ETypeUser.driver) {
      throw new MarketplaceOrderError('Este endpoint es solo para conductores', 403)
    }

    // Mismos requisitos que NearbyDrivers para el despacho automatico: si el conductor esta
    // ocupado, inactivo o sin verificar, el despacho automatico tampoco lo habria avisado - no
    // tiene sentido que la consulta manual le muestre algo que no podria tomar igual.
    if (
      vDriver.dataValues.statusDriver !== EStatusDriver.ACTIVE ||
      !vDriver.dataValues.verifiedDriver
    ) {
      return []
    }

    const vEligibleTypes: string[] = []
    if (vDriver.dataValues.daiFood) {
      vEligibleTypes.push(ETypeStore.FOOD)
    }
    if (vDriver.dataValues.daiMarket) {
      vEligibleTypes.push(ETypeStore.MARKET)
    }
    if (!vEligibleTypes.length) {
      // No habilitado para ningun tipo de Marketplace - nada que mostrarle (ver
      // ENTREGA_REPARTIDOR_PARA_RICARDO.md seccion 0, lo activa un admin, no la app).
      return []
    }

    const vOrders = await modelMarketplaceOrder.findAll({
      where: {
        status: EMarketplaceOrderStatus.BUSCANDO_CONDUCTOR,
        tripId: { [Op.ne]: null },
      },
      include: [
        {
          model: modelStore,
          as: 'store',
          required: true,
          attributes: ['id', 'name', 'logo', 'type', 'lat', 'lon'],
          where: { type: vEligibleTypes },
        },
        {
          model: modelTrip,
          as: 'trip',
          required: true,
          attributes: ['id'],
          where: { status: EStatusTrip.PENDIENTE, driverId: { [Op.is]: null } as any },
        },
      ],
    })

    const vResult: Array<{
      orderId: number
      tripId: number
      store: any
      deliveryFee: number
      distanceKm: number
    }> = []
    for (const vOrder of vOrders) {
      const vStore: any = (vOrder as any).dataValues.store
      const vStoreLat = Number(vStore?.dataValues?.lat)
      const vStoreLon = Number(vStore?.dataValues?.lon)
      if (!Number.isFinite(vStoreLat) || !Number.isFinite(vStoreLon)) {
        continue
      }
      const vDistanceKm = fxHaversineKm({ lat: vLat, lon: vLon }, { lat: vStoreLat, lon: vStoreLon })
      if (vDistanceKm >= vRadius) {
        continue
      }
      vResult.push({
        orderId: vOrder.dataValues.id,
        tripId: vOrder.dataValues.tripId as number,
        store: {
          id: vStore.dataValues.id,
          name: vStore.dataValues.name,
          logo: vStore.dataValues.logo,
          type: vStore.dataValues.type,
        },
        deliveryFee: vOrder.dataValues.deliveryFee,
        distanceKm: Math.round(vDistanceKm * 10) / 10,
      })
    }
    vResult.sort((pA, pB) => pA.distanceKm - pB.distanceKm)
    return vResult
  }
}

export default new MarketplaceOrderService()
