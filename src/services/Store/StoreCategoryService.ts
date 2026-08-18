/*
- File: StoreCategoryService.ts

- Purpose: Categorias de una tienda del Marketplace. Cada tienda maneja su propia lista,
  independiente de las demas. Un producto puede tener varias categorias (validado en
  StoreProductService, no aca).

==========Functions Manifest==========
- StoreCategoryService Methods:
  1 - validate: valida los campos con respecto al modelo
  2 - show: trae una categoria por id
  3 - all: lista las categorias de una tienda (?storeId=X). Publico, no tiene datos sensibles
  4 - allAdmin: version paginada/buscable para <app-list-items vIsAdmin>, misma data que all()
  5 - create: crea una categoria nueva
  6 - update: actualiza una categoria existente
  7 - softDeleteRecord: elimina (soft delete) una categoria
*/
import { type FindOptions } from 'sequelize'
import type { IStoreCategoryInstance } from '../../models/Store/StoreCategoryModel'
import { modelStoreCategory } from '../../models'
import type { IStoreCategoryInput, IResponseAllStoreCategory } from '../../types/StoreCategory'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IStoreCategoryService {
  validate(data: any): any
  show(pId: number): Promise<IStoreCategoryInstance | null>
  all(pStoreId: number): Promise<IStoreCategoryInstance[]>
  allAdmin(pParam: any): Promise<IResponseAllStoreCategory | IStoreCategoryInstance[]>
  create(payload: IStoreCategoryInput): Promise<IStoreCategoryInstance>
  update(payload: IStoreCategoryInput): Promise<IStoreCategoryInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class StoreCategoryService implements IStoreCategoryService {
  async validate(data: any) {
    const dataValidate = modelStoreCategory.build(data)
    await dataValidate.validate()
  }

  async show(pId: number): Promise<IStoreCategoryInstance | null> {
    try {
      const vResponse: IStoreCategoryInstance | null = await modelStoreCategory.findOne({
        where: { id: pId },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async all(pStoreId: number): Promise<IStoreCategoryInstance[]> {
    try {
      const vResponse: IStoreCategoryInstance[] = await modelStoreCategory.findAll({
        where: { storeId: pStoreId },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async allAdmin(pParam: any): Promise<IResponseAllStoreCategory | IStoreCategoryInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'StoreCategory'
      )
      if (pParam?.storeId) {
        whereStatement.where = { ...whereStatement.where, storeId: Number(pParam.storeId) }
      }
      const vResponse: IStoreCategoryInstance[] = await modelStoreCategory.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllStoreCategory = await fxReponseServices(
          pParam,
          whereStatement,
          'StoreCategory',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IStoreCategoryInput): Promise<IStoreCategoryInstance> {
    try {
      const vResponse: IStoreCategoryInstance = await modelStoreCategory.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IStoreCategoryInput): Promise<IStoreCategoryInstance | null> {
    try {
      if (pData?.id) {
        const vResponse: IStoreCategoryInstance | null = await modelStoreCategory.findOne({
          where: { id: pData.id },
        })
        await vResponse?.update(pData)
        return vResponse
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async softDeleteRecord(pId: number) {
    try {
      const record = await modelStoreCategory.update(
        { deletedAt: new Date() },
        { where: { id: pId } }
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
export default new StoreCategoryService()
