/*
- File: StoreFavoriteService.ts

- Purpose: Tiendas favoritas de un usuario. Es un toggle simple (agregar/quitar), no un evento a
  auditar - la tabla store_favorites no es paranoid, quitar de favoritos borra la fila de verdad.
  El flag isFavorite que se anota en los listados de tiendas (StoreController) usa
  fxGetFavoriteStoreIdSet de StoreService, no este servicio, para evitar un import circular.

==========Functions Manifest==========
- StoreFavoriteService Methods:
  1 - add: marca una tienda como favorita para un usuario (idempotente - si ya lo era, no duplica)
  2 - remove: quita una tienda de favoritos
  3 - all: lista paginada de las tiendas favoritas de un usuario, con los mismos datos publicos
      que /store/all
*/
import { modelStoreFavorite, modelStore } from '../../models'
import type { IStoreFavoriteInput } from '../../types/StoreFavorite'
import type { IStoreInstance } from '../../models/Store/StoreModel'
import type { IResponseAllStorePublic } from '../../types/Store'
import { fxToPublicStore, vStoreBusinessCategoryInclude } from './StoreService'
import { Op } from 'sequelize'

interface IStoreFavoriteService {
  add(payload: IStoreFavoriteInput): Promise<boolean>
  remove(payload: IStoreFavoriteInput): Promise<boolean>
  all(pUserId: string, pParam: any): Promise<IResponseAllStorePublic>
}

class StoreFavoriteService implements IStoreFavoriteService {
  async add(pData: IStoreFavoriteInput): Promise<boolean> {
    try {
      await modelStoreFavorite.findOrCreate({
        where: { userId: pData.userId, storeId: pData.storeId },
        defaults: pData,
      })
      return true
    } catch (error) {
      throw error
    }
  }

  async remove(pData: IStoreFavoriteInput): Promise<boolean> {
    try {
      await modelStoreFavorite.destroy({
        where: { userId: pData.userId, storeId: pData.storeId },
      })
      return true
    } catch (error) {
      throw error
    }
  }

  async all(pUserId: string, pParam: any): Promise<IResponseAllStorePublic> {
    try {
      const vLimit = Number(pParam?.limit) || 10
      const vPage = Number(pParam?.page) || 1
      const vOffset = (vPage - 1) * vLimit

      const vFavorites = await modelStoreFavorite.findAll({ where: { userId: pUserId } })
      const vStoreIds = vFavorites.map((pFav) => pFav.dataValues.storeId)
      if (!vStoreIds.length) {
        return { total: 0, totalPage: 1, data: [], actualPage: vPage } as unknown as IResponseAllStorePublic
      }

      const vWhere = { id: { [Op.in]: vStoreIds }, isApproved: true }
      const vCount: number = await modelStore.count({ where: vWhere })
      const vResponse: IStoreInstance[] = await modelStore.findAll({
        where: vWhere,
        include: [vStoreBusinessCategoryInclude],
        order: [['id', 'DESC']],
        limit: vLimit,
        offset: vOffset,
      })
      const vFavoriteIds = new Set(vStoreIds)

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
}
export default new StoreFavoriteService()
