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
import { modelMarketplaceOrder } from '../../models'
import { EMarketplaceOrderStatus } from '../../models/Marketplace/MarketplaceOrderModel'

const DEFAULT_INTERVAL_MS = 30_000
const MIN_INTERVAL_MS = 5_000

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
      const vDueOrders = await modelMarketplaceOrder.findAll({
        where: {
          status: EMarketplaceOrderStatus.PREPARANDO,
          tripId: null,
          dispatchAt: { [Op.lte]: new Date() },
        },
        attributes: ['id'],
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
          await this.dispatchClaimedOrder(vOrderId)
        }
      }
    } catch (error) {
      console.log('[marketplace-dispatch] error en el tick', error)
    } finally {
      this._running = false
    }
  }

  // STUB - [Orden 5/8] reemplaza esto por: crear el trip (ETypeService.MARKETPLACE), filtrar
  // conductores por dai_food/dai_market segun store.type, avisarles, y hacer la asignacion con
  // un UPDATE atomico WHERE driver_id IS NULL (ver riesgo 1 de ARQUITECTURA_MARKETPLACE.md).
  private async dispatchClaimedOrder(pOrderId: number): Promise<void> {
    console.log(
      `[marketplace-dispatch] orden ${pOrderId} reclamada y lista para asignar conductor - ` +
        'pendiente [Orden 5/8] (crear viaje + buscar conductor)'
    )
  }
}

export default new MarketplaceDispatchService()
