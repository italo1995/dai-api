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
import type { IStoreInstance } from '../../models/Store/StoreModel'
import { modelStore, modelBusinessCategory, modelStoreBusinessCategory, modelStoreFavorite } from '../../models'
import type { IStoreInput, IResponseAllStore, IResponseAllStorePublic, IStorePublic } from '../../types/Store'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'
import sequelize from '../../models'

// Campos seguros para exponer a un caller sin privilegios (app/cliente publico). Se usan tanto
// en all() como para achicar la respuesta de show() cuando quien pregunta no es el dueno ni admin.
export const vStorePublicFields = [
  'id', 'name', 'type', 'logo', 'lat', 'lon', 'cityId', 'isOpen', 'avgPrepTimeMinutes',
  'avgRating', 'ratingCount',
] as const

// include reutilizado por show()/all()/allAdmin() para traer las categorias de negocio sin que
// el cliente tenga que pedirlas aparte.
export const vStoreBusinessCategoryInclude = {
  model: modelBusinessCategory,
  as: 'businessCategories',
  attributes: ['id', 'name'],
  through: { attributes: [] },
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
        vWhere.name = { [Op.iLike]: `%${pParam.search}%` }
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

      const vCount: number = await modelStore.count({ where: vWhere })
      const vResponse: IStoreInstance[] = await modelStore.findAll({
        where: vWhere,
        include: [vStoreBusinessCategoryInclude],
        order: [['id', 'DESC']],
        limit: vLimit,
        offset: vOffset,
      })

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
        include: [vStoreBusinessCategoryInclude],
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
