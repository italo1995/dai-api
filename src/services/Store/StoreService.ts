/*
- File: StoreService.ts

- Purpose: Servicio de tiendas/comercios del Marketplace (DAI Food / DAI Market). Se encarga de
  las consultas con el modelo y de las reglas de negocio: aprobacion por admin antes de ser
  visible en la app, y scoping por dueño para el rol 'store'.

==========Functions Manifest==========
- StoreService Methods:
  1 - validate: valida los campos con respecto al modelo
  2 - show: trae una tienda por id
  3 - all: version publica para la app/cliente. Solo tiendas aprobadas (isApproved=true),
      paginada (limit/page), con busqueda por nombre y filtro por categoria de negocio
  4 - allAdmin: version para el panel. Si se pasa pOwnerId, se restringe a las tiendas de ese
      dueño (rol 'store'); si no, devuelve todas (rol admin/operator), con filtro opcional por
      estado de aprobacion y paginacion/busqueda
  5 - create: crea una tienda nueva, queda pendiente de aprobacion (isApproved=null)
  6 - update: actualiza una tienda existente
  7 - approve: marca una tienda como aprobada, limpia el motivo de rechazo
  8 - reject: marca una tienda como rechazada, exige el motivo
  9 - softDeleteRecord: elimina (soft delete) una tienda
*/
import { type FindOptions, Op } from 'sequelize'
import { EStoreOrderBy, type IStoreInstance } from '../../models/Store/StoreModel'
import { modelStore, modelBusinessCategory, modelStoreBusinessCategory, modelStoreFavorite, modelStoreProduct, modelCountry, modelStoreSchedule } from '../../models'
import type { IStoreInput, IResponseAllStore, IResponseAllStorePublic, IStorePublic } from '../../types/Store'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'
import sequelize from '../../models'

// Campos seguros para exponer a un caller sin privilegios (app/cliente publico). Se usan tanto
// en all() como para achicar la respuesta de show() cuando quien pregunta no es el dueno ni admin.
export const vStorePublicFields = [
  'id', 'name', 'type', 'logo', 'banner', 'description', 'lat', 'lon', 'cityId', 'isOpen',
  'avgPrepTimeMinutes', 'avgRating', 'ratingCount',
] as const

// include reutilizado por show()/all()/allAdmin() para traer las categorias de negocio sin que
// el cliente tenga que pedirlas aparte.
export const vStoreBusinessCategoryInclude = {
  model: modelBusinessCategory,
  as: 'businessCategories',
  attributes: ['id', 'name'],
  through: { attributes: [] },
}

// Filtro ?isOpenNow=true|false de all(). Calculado 100% en SQL (no post-filtrado en Node
// despues de traer resultados) para que la paginacion (total/totalPage via count()) siga siendo
// correcta - post-filtrar en JS despues de un LIMIT/OFFSET rompe el conteo real de resultados.
// Misma logica que fxIsStoreOpenNow pero en Postgres: convierte la hora actual a la zona del
// pais de la tienda (AT TIME ZONE) y la compara contra el horario de ESE dia de la semana
// (ISODOW: 1=lunes...7=domingo, se resta 1 para que coincida con dayOfWeek 0=lunes...6=domingo).
// LEFT JOIN + COALESCE (no INNER JOIN): una tienda sin countryId (country_id NULL) tiene que
// caer al mismo default 'America/Caracas' que usa fxIsStoreOpenNow del lado de JS - con INNER
// JOIN esa tienda quedaba afuera de CUALQUIER resultado de isOpenNow (ni true ni false la
// devolvian bien), aunque el campo calculado en la respuesta si la marcaba correctamente.
const vStoreOpenNowExistsSql = `EXISTS (
  SELECT 1 FROM store_schedules ss
  LEFT JOIN countries c ON c.id = "Store"."country_id"
  WHERE ss.store_id = "Store"."id"
    AND ss."deletedAt" IS NULL
    AND ss.is_active = true
    AND ss.day_of_week = (EXTRACT(ISODOW FROM (now() AT TIME ZONE COALESCE(c.timezone, 'America/Caracas')))::int - 1)
    AND (now() AT TIME ZONE COALESCE(c.timezone, 'America/Caracas'))::time >= ss.open_time
    AND (now() AT TIME ZONE COALESCE(c.timezone, 'America/Caracas'))::time < ss.close_time
)`

// Solo lo necesario para calcular isOpenNow (fxIsStoreOpenNow) - el horario completo no se
// expone en la respuesta publica, se descarta despues de calcular el booleano en fxToPublicStore.
export const vStoreOpenNowInclude = [
  {
    model: modelCountry,
    as: 'country',
    attributes: ['id', 'timezone'],
  },
  {
    model: modelStoreSchedule,
    as: 'schedules',
    attributes: ['dayOfWeek', 'openTime', 'closeTime', 'isActive'],
  },
]

// Dia de la semana (0=Lunes...6=Domingo, mismo orden que StoreSchedule.dayOfWeek) segun la hora
// LOCAL de pTimezone - usa Intl en vez de una libreria de fechas nueva, Node ya trae soporte de
// zonas horarias con el runtime ICU incluido.
const vWeekdayToDayOfWeek: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
}

// Compara la hora actual (convertida a la zona horaria del pais de la tienda) contra el horario
// de ESE dia de la semana. openTime/closeTime son horas locales sin zona propia (columnas TIME
// planas) - por eso hace falta saber en que zona esta la tienda antes de comparar; comparar
// directo contra la hora del servidor daria mal para cualquier tienda en otro huso horario.
// No soporta horarios que cruzan la medianoche (ej: abre 20:00 cierra 02:00) - se asume que
// closeTime siempre es mas tarde que openTime dentro del mismo dia.
export function fxIsStoreOpenNow(
  pSchedules: { dayOfWeek: number; openTime: string | null; closeTime: string | null; isActive?: boolean }[] | undefined,
  pTimezone: string | null | undefined
): boolean {
  if (!pSchedules?.length) {
    return false
  }
  const vParts = new Intl.DateTimeFormat('en-US', {
    timeZone: pTimezone || 'America/Caracas',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const vWeekday = vParts.find((pPart) => pPart.type === 'weekday')?.value ?? ''
  const vHour = vParts.find((pPart) => pPart.type === 'hour')?.value ?? '00'
  const vMinute = vParts.find((pPart) => pPart.type === 'minute')?.value ?? '00'
  // Algunos entornos de ICU devuelven '24' para la medianoche con hour12:false en vez de '00'.
  const vCurrentTime = `${vHour === '24' ? '00' : vHour}:${vMinute}:00`
  const vDayOfWeek = vWeekdayToDayOfWeek[vWeekday]
  const vTodaySchedule = pSchedules.find((pSchedule) => pSchedule.dayOfWeek === vDayOfWeek)
  if (!vTodaySchedule || vTodaySchedule.isActive === false || !vTodaySchedule.openTime || !vTodaySchedule.closeTime) {
    return false
  }
  return vCurrentTime >= vTodaySchedule.openTime && vCurrentTime < vTodaySchedule.closeTime
}

// pFavoriteStoreIds solo se pasa cuando quien pregunta esta logueado (ver StoreController) - sin
// sesion, isFavorite ni siquiera se incluye en la respuesta (no se manda 'false' a lo pavo).
export function fxToPublicStore(pStore: IStoreInstance, pFavoriteStoreIds?: Set<number>): IStorePublic {
  const vData: any = pStore.dataValues
  const vPublic: any = {}
  vStorePublicFields.forEach((vField) => {
    vPublic[vField] = vData[vField]
  })
  vPublic.businessCategories = vData.businessCategories ?? []
  if (pFavoriteStoreIds) {
    vPublic.isFavorite = pFavoriteStoreIds.has(vData.id)
  }
  // Solo esta presente cuando all() se llamo con lat/lon (ver StoreService.all) - Postgres lo
  // devuelve como string, se normaliza a number para que la app no tenga que parsearlo
  if (vData.distanceKm !== undefined && vData.distanceKm !== null) {
    vPublic.distanceKm = Number(vData.distanceKm)
  }
  // Solo se calcula cuando la query trajo el include de schedules (ver StoreService.all/show) -
  // isOpen (arriba, en vStorePublicFields) sigue siendo la bandera manual del dueño
  if (vData.schedules !== undefined) {
    vPublic.isOpenNow = fxIsStoreOpenNow(vData.schedules, vData.country?.dataValues?.timezone)
  }
  return vPublic as IStorePublic
}

// Trae los ids (de entre los dados) que el usuario tiene en favoritos, para anotar isFavorite en
// una lista sin hacer una consulta N+1 por tienda.
export async function fxGetFavoriteStoreIdSet(pUserId: string, pStoreIds: number[]): Promise<Set<number>> {
  if (!pStoreIds.length) {
    return new Set()
  }
  const vFavorites = await modelStoreFavorite.findAll({
    where: { userId: pUserId, storeId: pStoreIds },
    attributes: ['storeId'],
  })
  return new Set(vFavorites.map((pFav) => pFav.dataValues.storeId))
}

interface IStoreService {
  validate(data: any): any
  show(pId: number): Promise<IStoreInstance | null>
  all(pParam: any, pUserId?: string): Promise<IResponseAllStorePublic>
  allAdmin(pParam: any, pOwnerId?: string): Promise<IResponseAllStore | IStoreInstance[]>
  create(payload: IStoreInput): Promise<IStoreInstance>
  update(payload: IStoreInput): Promise<IStoreInstance | null>
  approve(pId: number): Promise<IStoreInstance | null>
  reject(pId: number, pReason: string): Promise<IStoreInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class StoreService implements IStoreService {
  async validate(data: any) {
    const dataValidate = modelStore.build(data)
    await dataValidate.validate()
  }

  // Endpoint publico consumido por la app: solo tiendas aprobadas por el admin. pParam.type
  // filtra por 'food' o 'market' (DAI Food vs DAI Market) - la app pide cada seccion por
  // separado en vez de traer todo mezclado. pParam.search busca por nombre, pParam.categoryId
  // filtra por una o varias categorias de negocio (id separados por coma - trae tiendas que
  // tengan AL MENOS una de esas categorias). Siempre pagina (limit default 10).
  public async all(pParam: any, pUserId?: string): Promise<IResponseAllStorePublic> {
    try {
      const vLimit = Number(pParam?.limit) || 10
      const vPage = Number(pParam?.page) || 1
      const vOffset = (vPage - 1) * vLimit

      const vWhere: any = { isApproved: true }
      if (pParam?.type === 'food' || pParam?.type === 'market') {
        vWhere.type = pParam.type
      }
      if (pParam?.search) {
        // Busca tanto por nombre de tienda como por nombre de producto vendido (ej: "Hamburguesa"
        // debe listar tiendas que se llamen asi Y tiendas que vendan hamburguesas, aunque no
        // tengan esa palabra en el nombre).
        const vMatchingProducts = await modelStoreProduct.findAll({
          where: { name: { [Op.iLike]: `%${pParam.search}%` }, isAvailable: true },
          attributes: ['storeId'],
        })
        const vProductStoreIds = [...new Set(vMatchingProducts.map((pProduct) => pProduct.dataValues.storeId))]
        vWhere[Op.or] = [
          { name: { [Op.iLike]: `%${pParam.search}%` } },
          ...(vProductStoreIds.length ? [{ id: { [Op.in]: vProductStoreIds } }] : []),
        ]
      }
      if (pParam?.categoryId) {
        const vCategoryIds: number[] = String(pParam.categoryId)
          .split(',')
          .map((pId) => Number(pId.trim()))
          .filter((pId) => !Number.isNaN(pId))
        if (vCategoryIds.length) {
          // Se filtra por la tabla puente en vez de meter esto en el include de
          // businessCategories que ya usa la respuesta (ese debe seguir trayendo TODAS las
          // categorias de la tienda, no solo las que matchean el filtro).
          const vMatches = await modelStoreBusinessCategory.findAll({
            where: { businessCategoryId: { [Op.in]: vCategoryIds } },
            attributes: ['storeId'],
          })
          const vStoreIds = [...new Set(vMatches.map((pMatch) => pMatch.dataValues.storeId))]
          vWhere.id = { [Op.in]: vStoreIds.length ? vStoreIds : [-1] }
        }
      }

      if (pParam?.isOpenNow === 'true' || pParam?.isOpenNow === true) {
        vWhere[Op.and] = [sequelize.literal(vStoreOpenNowExistsSql)]
      } else if (pParam?.isOpenNow === 'false' || pParam?.isOpenNow === false) {
        vWhere[Op.and] = [sequelize.literal(`NOT ${vStoreOpenNowExistsSql}`)]
      }

      // Busqueda/orden por cercania. El calculo exacto (Haversine) es relativamente caro si se
      // corre sobre toda la tabla, asi que primero se recorta con un bounding-box (un simple
      // rango de lat/lon, que si usa el indice stores_lat_lon_idx) y recien sobre ese subconjunto
      // chico se pide a Postgres que calcule y ordene por distancia real - nunca se trae todo a
      // Node para calcular ahi (eso si bloquearia el event loop con muchas tiendas/pedidos
      // concurrentes).
      const vLat = Number(pParam?.lat)
      const vLon = Number(pParam?.lon)
      const vHasGeo = pParam?.lat !== undefined && pParam?.lon !== undefined && !Number.isNaN(vLat) && !Number.isNaN(vLon)
      // orderBy es independiente del filtro de radio: lat/lon siempre recorta por cercania (si
      // vienen), pero el orden del resultado se puede pedir aparte (relevance/rating/distance).
      // Si piden distance sin mandar lat/lon (no hay de donde sacar la distancia), se cae de
      // vuelta a relevance en silencio en vez de devolver un error - un dato faltante no debería
      // romper el listado.
      const vOrderByRequested = Object.values(EStoreOrderBy).includes(pParam?.orderBy)
        ? (pParam.orderBy as EStoreOrderBy)
        : vHasGeo
          ? EStoreOrderBy.DISTANCE
          : EStoreOrderBy.RELEVANCE
      const vOrderBy = vOrderByRequested === EStoreOrderBy.DISTANCE && !vHasGeo ? EStoreOrderBy.RELEVANCE : vOrderByRequested

      let vOrder: any = [['id', 'DESC']]
      let vDistanceAttribute: any = null
      if (vOrderBy === EStoreOrderBy.RATING) {
        vOrder = [['avgRating', 'DESC']]
      }
      if (vHasGeo) {
        const vRadiusKm = Number(pParam?.radiusKm) > 0 ? Number(pParam.radiusKm) : 15
        const vLatDelta = vRadiusKm / 111.32
        const vLonDelta = vRadiusKm / (111.32 * Math.max(Math.cos((vLat * Math.PI) / 180), 0.01))
        vWhere.lat = { [Op.between]: [vLat - vLatDelta, vLat + vLatDelta] }
        vWhere.lon = { [Op.between]: [vLon - vLonDelta, vLon + vLonDelta] }
        // Formula de Haversine (grados -> radianes, distancia sobre una esfera de radio 6371km).
        // Se usa asin(sqrt(...)) en vez de acos(...) porque es numericamente mas estable cerca de
        // distancia 0 (acos puede devolver NaN por errores de redondeo cuando el argumento se
        // pasa levemente de 1).
        vDistanceAttribute = sequelize.literal(
          `6371 * 2 * asin(sqrt(
            power(sin(radians("Store"."lat" - ${vLat}) / 2), 2) +
            cos(radians(${vLat})) * cos(radians("Store"."lat")) *
            power(sin(radians("Store"."lon" - ${vLon}) / 2), 2)
          ))`
        )
        if (vOrderBy === EStoreOrderBy.DISTANCE) {
          vOrder = [[sequelize.literal('"distanceKm"'), 'ASC']]
        }
      }

      const vCount: number = await modelStore.count({ where: vWhere })
      const vFindOptions: any = {
        where: vWhere,
        include: [vStoreBusinessCategoryInclude, ...vStoreOpenNowInclude],
        order: vOrder,
        limit: vLimit,
        offset: vOffset,
      }
      if (vDistanceAttribute) {
        vFindOptions.attributes = { include: [[vDistanceAttribute, 'distanceKm']] }
      }
      // unscoped(): el defaultScope del modelo ordena por createdAt DESC, y Sequelize CONCATENA
      // (no reemplaza) el order de la query con el de la scope - sin esto, "createdAt DESC"
      // quedaba como criterio primario por delante de vOrder, pisando en silencio tanto
      // orderBy=rating como orderBy=distance (esta query siempre define su propio orden a mano,
      // asi que no hace falta el de la scope).
      const vResponse: IStoreInstance[] = await modelStore.unscoped().findAll(vFindOptions)

      const vFavoriteIds = pUserId
        ? await fxGetFavoriteStoreIdSet(pUserId, vResponse.map((pStore) => pStore.dataValues.id))
        : undefined

      return {
        total: vCount,
        totalPage: Math.max(Math.ceil(vCount / vLimit), 1),
        data: vResponse.map((pStore) => fxToPublicStore(pStore, vFavoriteIds)),
        actualPage: vPage,
      } as unknown as IResponseAllStorePublic
    } catch (error) {
      throw error
    }
  }

  public async allAdmin(
    pParam: any,
    pOwnerId?: string
  ): Promise<IResponseAllStore | IStoreInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'Store'
      )
      if (pOwnerId) {
        whereStatement.where = { ...whereStatement.where, ownerId: pOwnerId }
      } else if (pParam?.isApproved === 'true') {
        whereStatement.where = { ...whereStatement.where, isApproved: true }
      } else if (pParam?.isApproved === 'false') {
        whereStatement.where = { ...whereStatement.where, isApproved: false }
      } else if (pParam?.isApproved === 'pending') {
        whereStatement.where = { ...whereStatement.where, isApproved: null }
      }
      if (pParam?.type === 'food' || pParam?.type === 'market') {
        whereStatement.where = { ...whereStatement.where, type: pParam.type }
      }

      whereStatement.include = [vStoreBusinessCategoryInclude]
      const vResponse: IStoreInstance[] = await modelStore.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllStore = await fxReponseServices(
          pParam,
          whereStatement,
          'Store',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IStoreInstance | null> {
    try {
      const vResponse: IStoreInstance | null = await modelStore.findOne({
        where: {
          id: pId,
        },
        include: [vStoreBusinessCategoryInclude, ...vStoreOpenNowInclude],
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  // Valida que todos los businessCategoryIds existan y sean del mismo type ('food'/'market') que
  // la tienda. Tira un error legible en vez de guardar datos inconsistentes.
  private async fxValidateBusinessCategories(pType: string, pBusinessCategoryIds: number[]) {
    if (!pBusinessCategoryIds.length) {
      throw new Error('Debe seleccionar al menos una categoria de negocio')
    }
    const vCategories = await modelBusinessCategory.findAll({
      where: { id: pBusinessCategoryIds },
    })
    if (
      vCategories.length !== pBusinessCategoryIds.length ||
      vCategories.some((pCat) => pCat.dataValues.type !== pType)
    ) {
      throw new Error('Una o mas categorias no son validas para el tipo de tienda seleccionado')
    }
  }

  private async fxSetBusinessCategories(pStoreId: number, pBusinessCategoryIds: number[]) {
    await sequelize.transaction(async (pTransaction) => {
      await modelStoreBusinessCategory.destroy({ where: { storeId: pStoreId }, transaction: pTransaction })
      await modelStoreBusinessCategory.bulkCreate(
        pBusinessCategoryIds.map((pBusinessCategoryId) => ({ storeId: pStoreId, businessCategoryId: pBusinessCategoryId })),
        { transaction: pTransaction }
      )
    })
  }

  async create(pData: IStoreInput): Promise<IStoreInstance> {
    try {
      const { businessCategoryIds, ...vStoreData } = pData
      await this.fxValidateBusinessCategories(pData.type, businessCategoryIds ?? [])
      const vResponse: IStoreInstance = await modelStore.create(vStoreData)
      await this.fxSetBusinessCategories(vResponse.dataValues.id, businessCategoryIds ?? [])
      return (await this.show(vResponse.dataValues.id)) as IStoreInstance
    } catch (error) {
      throw error
    }
  }

  async update(pData: IStoreInput): Promise<IStoreInstance | null> {
    try {
      if (pData?.id) {
        const vExisting: IStoreInstance | null = await modelStore.findOne({
          where: { id: pData.id },
        })
        if (!vExisting) {
          return null
        }
        const { businessCategoryIds, ...vStoreData } = pData
        if (businessCategoryIds !== undefined) {
          const vType = vStoreData.type ?? vExisting.dataValues.type
          await this.fxValidateBusinessCategories(vType, businessCategoryIds)
        }
        await vExisting.update(vStoreData)
        if (businessCategoryIds !== undefined) {
          await this.fxSetBusinessCategories(vExisting.dataValues.id, businessCategoryIds)
        }
        return await this.show(vExisting.dataValues.id)
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async approve(pId: number): Promise<IStoreInstance | null> {
    try {
      const vResponse: IStoreInstance | null = await modelStore.findOne({ where: { id: pId } })
      await vResponse?.update({ isApproved: true, rejectionReason: null })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async reject(pId: number, pReason: string): Promise<IStoreInstance | null> {
    try {
      const vResponse: IStoreInstance | null = await modelStore.findOne({ where: { id: pId } })
      await vResponse?.update({ isApproved: false, rejectionReason: pReason })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async softDeleteRecord(pId: number) {
    try {
      const record = await modelStore.update(
        { deletedAt: new Date() },
        {
          where: { id: pId },
        }
      )
      if (!record) {
        return false
      }
      return true
    } catch (error) {
      throw error
    }
  }
}
export default new StoreService()
