/*
- File: MarketplaceDispatchService.ts
- Purpose: [Orden 4/8] Scheduler de despacho. El proyecto no tiene NINGUN mecanismo de jobs/cron/
  cola (ver ARQUITECTURA_MARKETPLACE.md seccion 3). Se implementa la opcion recomendada ahi: un
  worker de polling en el mismo proceso de la API, con reclamo atomico contra la base para que
  sobreviva un restart y este listo para migrar a Redis/BullMQ el dia que haya mas de una
  instancia.

  Cada tick busca pedidos PREPARANDO cuyo dispatchAt ya paso y todavia no tienen viaje, y los
  reclama uno por uno con un UPDATE condicionado (WHERE id=X AND status='preparando pedido' AND
  trip_id IS NULL) - solo el tick/instancia que afecta 1 fila se lo queda. Cubre los dos casos
  que arma [Orden 3/8]: dispatchAt = ahora (prep < 20 min, despacho inmediato) y dispatchAt =
  readyAt - 15min (prep >= 20, diferido).

  Lo que hace con un pedido ya reclamado (dispatchClaimedOrder) es un STUB por ahora: crear el
  viaje + filtrar y avisar conductores + asignacion atomica es [Orden 5/8]. Hasta que eso exista,
  un pedido reclamado queda en 'buscando conductor' sin trip_id.
*/
import { Op } from 'sequelize'
import sequelize, {
  modelMarketplaceOrder,
  modelStore,
  modelTrip,
  modelTripRoute,
} from '../../models'
import { EMarketplaceOrderStatus } from '../../models/Marketplace/MarketplaceOrderModel'
import { EStatusTrip, ETypeService } from '../../models/Trip/TripModel'
import ClassUserService from '../User/UserService'
import ClassAuthService from '../User/AuthService'
import NotificationService from '../../controller/fcmPushController'
import { SocketService } from '../../ws'

const DEFAULT_INTERVAL_MS = 30_000
const MIN_INTERVAL_MS = 5_000
// Si un pedido queda reclamado (BUSCANDO_CONDUCTOR) pero sin viaje mas de esto, algo fallo al
// despacharlo - se devuelve a PREPARANDO para reintentar en el proximo tick.
const STUCK_CLAIM_MS = 2 * 60_000
// Radio de busqueda de repartidores alrededor de la tienda (km).
const DISPATCH_SEARCH_RADIUS_KM = 15

class MarketplaceDispatchService {
  private _timer: NodeJS.Timeout | null = null
  private _running = false

  get intervalMs(): number {
    const vRaw = Number(process.env.MARKETPLACE_DISPATCH_INTERVAL_MS)
    if (!Number.isFinite(vRaw) || vRaw < MIN_INTERVAL_MS) {
      return DEFAULT_INTERVAL_MS
    }
    return vRaw
  }

  startScheduler(): void {
    if (this._timer) {
      return
    }
    const vInterval = this.intervalMs
    console.log(`[marketplace-dispatch] scheduler iniciado, cada ${vInterval}ms`)
    this._timer = setInterval(() => {
      void this.runTick()
    }, vInterval)
    // Un tick inicial al arrancar, por si el proceso estuvo caido y hay pedidos ya vencidos.
    void this.runTick()
  }

  stopScheduler(): void {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  }

  async runTick(): Promise<void> {
    if (this._running) {
      // El tick anterior todavia no termino - no encimamos.
      return
    }
    this._running = true
    try {
      await this.recoverStuckClaims()
      const vDueOrders = await modelMarketplaceOrder.findAll({
        where: {
          status: EMarketplaceOrderStatus.PREPARANDO,
          tripId: null,
          dispatchAt: { [Op.lte]: new Date() },
        },
        attributes: ['id', 'customerId'],
      })
      for (const vOrder of vDueOrders) {
        const vOrderId = vOrder.dataValues.id
        // Reclamo atomico: solo se lo queda quien afecta 1 fila. Bajo un solo proceso esto ya
        // es suficiente; el dia que haya varias instancias sigue siendo correcto (dos instancias
        // pueden ver el mismo pedido en el findAll, pero solo una gana el UPDATE).
        const [vClaimed] = await modelMarketplaceOrder.update(
          { status: EMarketplaceOrderStatus.BUSCANDO_CONDUCTOR },
          {
            where: {
              id: vOrderId,
              status: EMarketplaceOrderStatus.PREPARANDO,
              tripId: null,
            },
          }
        )
        if (vClaimed === 1) {
          try {
            const vCustomer = await ClassAuthService.show(vOrder.dataValues.customerId)
            if (vCustomer?.dataValues.socketId) {
              SocketService.io.to(vCustomer.dataValues.socketId).emit('marketplaceOrderStatusUpdate', {
                orderId: vOrderId,
                status: EMarketplaceOrderStatus.BUSCANDO_CONDUCTOR,
                tripId: null,
                driver: null,
                trip: null,
              })
            }
          } catch (error) {
            console.log(`[marketplace-dispatch] orden ${vOrderId}: fallo avisando al cliente`, error)
          }
          await this.dispatchClaimedOrder(vOrderId)
        }
      }
    } catch (error) {
      console.log('[marketplace-dispatch] error en el tick', error)
    } finally {
      this._running = false
    }
  }

  // Un pedido en BUSCANDO_CONDUCTOR sin trip_id por mas de STUCK_CLAIM_MS = algo fallo entre el
  // reclamo y la creacion del viaje (proceso muerto en el medio, etc). Se devuelve a PREPARANDO
  // para que el proximo tick lo reintente. Nota: una vez que existe trip_id, la asignacion del
  // conductor es responsabilidad del evento de socket 'acceptMarketplaceOrder', no de aca.
  private async recoverStuckClaims(): Promise<void> {
    const vCutoff = new Date(Date.now() - STUCK_CLAIM_MS)
    const [vReverted] = await modelMarketplaceOrder.update(
      { status: EMarketplaceOrderStatus.PREPARANDO },
      {
        where: {
          status: EMarketplaceOrderStatus.BUSCANDO_CONDUCTOR,
          tripId: null,
          updatedAt: { [Op.lt]: vCutoff },
        },
      }
    )
    if (vReverted) {
      console.log(`[marketplace-dispatch] ${vReverted} pedido(s) colgado(s) devuelto(s) a PREPARANDO`)
    }
  }

  // [Orden 5/8] El pedido ya esta reclamado (status BUSCANDO_CONDUCTOR, sin trip). Crea el viaje
  // (comercio -> cliente), lo linkea al pedido, y avisa a los repartidores habilitados
  // (dai_food/dai_market segun store.type) cerca de la tienda. La asignacion al primer conductor
  // que acepta la hace el evento de socket 'acceptMarketplaceOrder' (ws.ts) con un UPDATE
  // atomico - aca solo se dispara la busqueda.
  private async dispatchClaimedOrder(pOrderId: number): Promise<void> {
    const vOrder = await modelMarketplaceOrder.findByPk(pOrderId)
    if (!vOrder) {
      return
    }
    const vStore = await modelStore.findByPk(vOrder.dataValues.storeId)
    const vStoreLat = Number(vStore?.dataValues.lat)
    const vStoreLon = Number(vStore?.dataValues.lon)
    const vDelLat = Number(vOrder.dataValues.deliveryLat)
    const vDelLon = Number(vOrder.dataValues.deliveryLon)
    if (
      !vStore ||
      !Number.isFinite(vStoreLat) ||
      !Number.isFinite(vStoreLon) ||
      !Number.isFinite(vDelLat) ||
      !Number.isFinite(vDelLon)
    ) {
      // Sin coordenadas no se puede armar el viaje. Se deja en BUSCANDO_CONDUCTOR (no vuelve a
      // PREPARANDO porque el problema no se arregla solo) - un operador tiene que intervenir.
      console.log(
        `[marketplace-dispatch] orden ${pOrderId}: faltan coordenadas (tienda o entrega), no se puede despachar`
      )
      return
    }

    let vTripId: number
    try {
      vTripId = await sequelize.transaction(async (pTransaction) => {
        const vTrip = await modelTrip.create(
          {
            typeService: ETypeService.MARKETPLACE,
            userId: vOrder.dataValues.customerId,
            status: EStatusTrip.PENDIENTE,
            currencyId: vOrder.dataValues.currencyId ?? null,
            cityId: vStore.dataValues.cityId ?? null,
            regionId: vStore.dataValues.regionId ?? null,
            countryId: vStore.dataValues.countryId ?? null,
            isPayment: 0,
          } as any,
          { transaction: pTransaction }
        )
        await modelTripRoute.bulkCreate(
          [
            {
              tripId: vTrip.dataValues.id,
              isInit: true,
              isEnd: false,
              orden: 0,
              lat: vStoreLat,
              lon: vStoreLon,
              address: vStore.dataValues.name ?? null,
            },
            {
              tripId: vTrip.dataValues.id,
              isInit: false,
              isEnd: true,
              orden: 1,
              lat: vDelLat,
              lon: vDelLon,
              address: vOrder.dataValues.deliveryAddress ?? null,
            },
          ] as any,
          { transaction: pTransaction }
        )
        await vOrder.update({ tripId: vTrip.dataValues.id }, { transaction: pTransaction })
        return vTrip.dataValues.id
      })
    } catch (error) {
      console.log(`[marketplace-dispatch] orden ${pOrderId}: fallo creando el viaje`, error)
      return
    }

    // Buscar y avisar repartidores (best-effort - no revierte nada si falla).
    try {
      const vDrivers: any[] = await ClassUserService.NearbyDrivers({
        lat: vStoreLat,
        lon: vStoreLon,
        distance: DISPATCH_SEARCH_RADIUS_KM,
        typeService: ETypeService.MARKETPLACE,
        storeType: vStore.dataValues.type,
        minAmount: Number(vOrder.dataValues.deliveryFee) || 0,
        currencyId: vOrder.dataValues.currencyId ?? null,
      })
      const vPayload = {
        orderId: pOrderId,
        tripId: vTripId,
        store: { id: vStore.dataValues.id, name: vStore.dataValues.name, logo: vStore.dataValues.logo, type: vStore.dataValues.type },
        deliveryFee: vOrder.dataValues.deliveryFee,
      }
      const vSocketIds = vDrivers.map((d) => d.socketId).filter(Boolean)
      const vPushIds = vDrivers.map((d) => d.dataValues?.tokenPush ?? d.tokenPush).filter(Boolean)
      if (vSocketIds.length) {
        SocketService.io.to(vSocketIds).emit('newMarketplaceOrder', vPayload)
      }
      if (vPushIds.length) {
        await NotificationService.sendNotification(vPushIds, {
          title: 'Nuevo pedido para repartir',
          body: `${vStore.dataValues.name} tiene un pedido listo. ¡Eso es DAI!`,
          data: JSON.stringify(vPayload),
        })
      }
      console.log(
        `[marketplace-dispatch] orden ${pOrderId} -> viaje ${vTripId}, avisados ${vDrivers.length} repartidor(es)`
      )
      if (!vDrivers.length) {
        console.log(`[marketplace-dispatch] orden ${pOrderId}: sin repartidores disponibles cerca`)
      }
    } catch (error) {
      console.log(`[marketplace-dispatch] orden ${pOrderId}: fallo avisando repartidores`, error)
    }
  }
}

export default new MarketplaceDispatchService()
