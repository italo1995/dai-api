/*
- File: StoreRatingService.ts

- Purpose: Calificaciones de tiendas (1-5 estrellas + comentario opcional). Cada fila es el
  registro de auditoria completo de una calificacion; el promedio/cantidad que se consulta
  normalmente vive denormalizado en stores.avgRating/ratingCount (ver StoreService), asi no hay
  que recorrer store_ratings para mostrar el numero. Un usuario tiene una sola calificacion por
  tienda (unique por app, no por constraint de DB) - volver a calificar actualiza la existente.

==========Functions Manifest==========
- StoreRatingService Methods:
  1 - validate: valida los campos con respecto al modelo
  2 - show: trae una calificacion por id
  3 - all: version publica - comentarios de una tienda (?storeId=X), paginada
  4 - allAdmin: version paginada/buscable para moderacion en el panel
  5 - rate: crea o actualiza la calificacion de un usuario para una tienda, y recalcula
      stores.avgRating/ratingCount (formula correctiva, sin recorrer toda la tabla)
  6 - softDeleteRecord: elimina (soft delete) una calificacion (moderacion) y recalcula el
      agregado de la tienda
*/
import { type FindOptions } from 'sequelize'
import type { IStoreRatingInstance } from '../../models/Store/StoreRatingModel'
import { modelStoreRating, modelStore } from '../../models'
import type { IStoreRatingInput, IResponseAllStoreRating } from '../../types/StoreRating'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'
import sequelize from '../../models'

// El promedio nunca puede superar 5 (ni bajar de 0 si algo raro pasa con el redondeo). Se
// redondea a 2 decimales para no arrastrar el error de punto flotante indefinidamente.
function fxClampAverage(pValue: number): number {
  return Math.round(Math.min(5, Math.max(0, pValue)) * 100) / 100
}

interface IStoreRatingService {
  validate(data: any): any
  show(pId: number): Promise<IStoreRatingInstance | null>
  all(pParam: any): Promise<IResponseAllStoreRating>
  allAdmin(pParam: any): Promise<IResponseAllStoreRating | IStoreRatingInstance[]>
  rate(payload: IStoreRatingInput): Promise<IStoreRatingInstance>
  softDeleteRecord(pId: number): Promise<boolean>
}

class StoreRatingService implements IStoreRatingService {
  async validate(data: any) {
    const dataValidate = modelStoreRating.build(data)
    await dataValidate.validate()
  }

  async show(pId: number): Promise<IStoreRatingInstance | null> {
    try {
      const vResponse: IStoreRatingInstance | null = await modelStoreRating.findOne({
        where: { id: pId },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  public async all(pParam: any): Promise<IResponseAllStoreRating> {
    try {
      const vLimit = Number(pParam?.limit) || 10
      const vPage = Number(pParam?.page) || 1
      const vOffset = (vPage - 1) * vLimit
      const vWhere: any = { storeId: Number(pParam?.storeId) }

      const vCount: number = await modelStoreRating.count({ where: vWhere })
      const vResponse: IStoreRatingInstance[] = await modelStoreRating.findAll({
        where: vWhere,
        include: [{ association: 'user', attributes: ['id', 'name', 'lastName'] }],
        limit: vLimit,
        offset: vOffset,
      })

      return {
        total: vCount,
        totalPage: Math.max(Math.ceil(vCount / vLimit), 1),
        data: vResponse,
        actualPage: vPage,
      } as unknown as IResponseAllStoreRating
    } catch (error) {
      throw error
    }
  }

  async allAdmin(pParam: any): Promise<IResponseAllStoreRating | IStoreRatingInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'comment',
        'StoreRating'
      )
      if (pParam?.storeId) {
        whereStatement.where = { ...whereStatement.where, storeId: Number(pParam.storeId) }
      }
      whereStatement.include = [{ association: 'user', attributes: ['id', 'name', 'lastName'] }]
      const vResponse: IStoreRatingInstance[] = await modelStoreRating.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllStoreRating = await fxReponseServices(
          pParam,
          whereStatement,
          'StoreRating',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async rate(pData: IStoreRatingInput): Promise<IStoreRatingInstance> {
    try {
      return await sequelize.transaction(async (pTransaction) => {
        const vStore = await modelStore.findOne({ where: { id: pData.storeId }, transaction: pTransaction })
        if (!vStore) {
          throw new Error('Tienda no encontrada')
        }
        const vExisting = await modelStoreRating.findOne({
          where: { storeId: pData.storeId, userId: pData.userId },
          transaction: pTransaction,
        })

        const vOldAvg = vStore.dataValues.avgRating || 0
        const vOldCount = vStore.dataValues.ratingCount || 0

        if (!vExisting) {
          const vResponse = await modelStoreRating.create(pData, { transaction: pTransaction })
          const vNewCount = vOldCount + 1
          const vNewAvg = fxClampAverage((vOldAvg * vOldCount + pData.rating) / vNewCount)
          await vStore.update({ avgRating: vNewAvg, ratingCount: vNewCount }, { transaction: pTransaction })
          return vResponse
        }

        const vOldRating = vExisting.dataValues.rating
        await vExisting.update(
          { rating: pData.rating, comment: pData.comment ?? null, orderId: pData.orderId ?? null },
          { transaction: pTransaction }
        )
        const vNewAvg = vOldCount
          ? fxClampAverage(vOldAvg + (pData.rating - vOldRating) / vOldCount)
          : fxClampAverage(pData.rating)
        await vStore.update({ avgRating: vNewAvg }, { transaction: pTransaction })
        return vExisting
      })
    } catch (error) {
      throw error
    }
  }

  async softDeleteRecord(pId: number) {
    try {
      await sequelize.transaction(async (pTransaction) => {
        const vRating = await modelStoreRating.findOne({ where: { id: pId }, transaction: pTransaction })
        if (!vRating) {
          throw new Error('Calificacion no encontrada')
        }
        const vStore = await modelStore.findOne({
          where: { id: vRating.dataValues.storeId },
          transaction: pTransaction,
        })
        if (vStore) {
          const vOldAvg = vStore.dataValues.avgRating || 0
          const vOldCount = vStore.dataValues.ratingCount || 0
          const vNewCount = Math.max(vOldCount - 1, 0)
          const vNewAvg = vNewCount
            ? fxClampAverage((vOldAvg * vOldCount - vRating.dataValues.rating) / vNewCount)
            : 0
          await vStore.update({ avgRating: vNewAvg, ratingCount: vNewCount }, { transaction: pTransaction })
        }
        await vRating.destroy({ transaction: pTransaction })
      })
      return true
    } catch (error) {
      throw error
    }
  }
}
export default new StoreRatingService()
