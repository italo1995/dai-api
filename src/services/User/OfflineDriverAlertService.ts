import { QueryTypes } from 'sequelize'
import sequelize from '../../models'
import { ETypeService } from '../../models/Trip/TripModel'
import NotificationService from '../../controller/fcmPushController'
import { PushMessages } from '../../constants/pushMessages'
import CompanyParameterService from '../web/CompanyParameterService'
import CurrencyService from '../Payments/CurrencyService'

// Aviso generico "hay un servicio cerca de tu ultima ubicacion" para conductores ACTIVOS que
// ahora mismo NO tienen socket conectado (app en segundo plano o cerrada por el SO). Es un
// metodo aparte de UserService.NearbyDrivers a proposito: ese alimenta el mapa del pasajero y los
// emits por socket, y exige socket_id - esto es solo un "despierta y conectate", no ofrece el
// servicio ni lleva datos del viaje/pedido (el conductor lo ve al abrir la app y reconectar).
const RADIUS_DEFAULT_KM = 30
const COOLDOWN_MS = 10 * 60 * 1000 // un mismo conductor no recibe este aviso mas de 1 vez cada 10 min
const MAX_DRIVERS = 200
const KM_PER_DEGREE = 111

interface IOfflineAlertParam {
  lat: number
  lon: number
  distance?: number
  typeService: ETypeService
  storeType?: string
  minAmount?: number
  currencyId?: number | null | undefined
}

class OfflineDriverAlertService {
  // En memoria: se pierde al reiniciar el proceso (peor caso, un aviso repetido) y no se comparte
  // entre instancias. Suficiente para un aviso best-effort.
  private lastAlertAt = new Map<string, number>()

  private async findOfflineDrivers(pParam: IOfflineAlertParam): Promise<Array<{ id: string; token_push: string }>> {
    const vLat = Number(pParam.lat)
    const vLon = Number(pParam.lon)
    const vDistance = Number(pParam.distance) || RADIUS_DEFAULT_KM

    // Mismo criterio de balance minimo que NearbyDrivers (comision sobre el monto del servicio).
    const vPercentageParameter = await CompanyParameterService.showByName('percentage')
    const vPercentage: number = Number(vPercentageParameter?.dataValues?.value) || 10
    const vCommission = pParam.minAmount ? (pParam.minAmount * vPercentage) / 100 : 0
    let vMinBalance = 0
    if (pParam.currencyId && vCommission) {
      vMinBalance = await CurrencyService.convertToPrincipal({
        currencyId: Number(pParam.currencyId),
        amount: Number(vCommission),
      })
    }

    // Caja lat/lon previa para descartar filas baratamente antes de calcular el coseno esferico.
    const vDegLat = vDistance / KM_PER_DEGREE
    const vDegLon = vDistance / (KM_PER_DEGREE * Math.max(Math.cos((vLat * Math.PI) / 180), 0.01))

    let vQuery = `SELECT u.id, u.token_push FROM users u
      LEFT JOIN vehicle_types vt ON u.vehicle_type = vt.id
      WHERE u.status_driver = 1 AND u.verified_driver = true AND u.type_user = '2'
        AND u.socket_id IS NULL AND u.token_push IS NOT NULL AND u.token_push <> ''
        AND u.balance > :minBalance
        AND u.lat BETWEEN :latMin AND :latMax AND u.lon BETWEEN :lonMin AND :lonMax
        AND (6371 * acos(least(1, cos(radians(:lat)) * cos(radians(u.lat)) * cos(radians(u.lon) - radians(:lon)) + sin(radians(:lat)) * sin(radians(u.lat))))) < :distance`
    if (pParam.typeService === ETypeService.CAR) {
      vQuery += ' AND vt.is_car = true AND vt.is_moto = false'
    }
    if (pParam.typeService === ETypeService.MOTO) {
      vQuery += ' AND vt.is_car = false AND vt.is_moto = true'
    }
    if (pParam.typeService === ETypeService.MARKETPLACE) {
      vQuery += pParam.storeType === 'market' ? ' AND u.dai_market = true' : ' AND u.dai_food = true'
    }
    vQuery += ` LIMIT ${MAX_DRIVERS}`

    return sequelize.query(vQuery, {
      type: QueryTypes.SELECT,
      replacements: {
        minBalance: vMinBalance,
        lat: vLat,
        lon: vLon,
        latMin: vLat - vDegLat,
        latMax: vLat + vDegLat,
        lonMin: vLon - vDegLon,
        lonMax: vLon + vDegLon,
        distance: vDistance,
      },
    }) as Promise<Array<{ id: string; token_push: string }>>
  }

  // Fire-and-forget: los llamadores NO deben hacer await. Nunca lanza - un fallo aqui no puede
  // afectar la creacion del viaje/pedido.
  notifyNearbyOfflineDrivers(pParam: IOfflineAlertParam): void {
    void (async () => {
      try {
        if (!Number.isFinite(Number(pParam.lat)) || !Number.isFinite(Number(pParam.lon))) return
        const vNow = Date.now()
        for (const [vId, vAt] of this.lastAlertAt) {
          if (vNow - vAt > COOLDOWN_MS) this.lastAlertAt.delete(vId)
        }
        const vDrivers = await this.findOfflineDrivers(pParam)
        const vTargets = vDrivers.filter((vDriver) => !this.lastAlertAt.has(String(vDriver.id)))
        if (!vTargets.length) return
        vTargets.forEach((vDriver) => this.lastAlertAt.set(String(vDriver.id), vNow))
        await NotificationService.sendNotification(
          vTargets.map((vDriver) => vDriver.token_push),
          PushMessages.servicioCercaUltimaUbicacion()
        )
        console.log(`[offline-driver-alert] avisados ${vTargets.length} conductor(es) sin socket`)
      } catch (error) {
        console.log('[offline-driver-alert] fallo (ignorado):', error)
      }
    })()
  }
}

export default new OfflineDriverAlertService()
