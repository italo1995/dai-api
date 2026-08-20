/*
- File: BusinessCategoryService.ts

- Purpose: Categorias de NEGOCIO globales (categorizan la tienda en si, no sus productos). Las
  crea unicamente el admin/operator. Estan atadas a un type ('food'/'market') igual que las
  tiendas, para que una tienda food solo pueda elegir entre categorias food (esa validacion vive
  en StoreService, no aca).

==========Functions Manifest==========
- BusinessCategoryService Methods:
  1 - validate: valida los campos con respecto al modelo
  2 - show: trae una categoria por id
  3 - all: version publica para la app/panel, opcionalmente filtrada por ?type=food|market.
      No pagina por defecto (son pocas) - si se envia ?page se pagina, con ?limit opcional
  4 - allAdmin: version paginada/buscable para <app-list-items vIsAdmin>
  5 - create: crea una categoria nueva
  6 - update: actualiza una categoria existente
  7 - softDeleteRecord: elimina (soft delete) una categoria
*/
import { type FindOptions } from 'sequelize'
import type { IBusinessCategoryInstance } from '../../models/Store/BusinessCategoryModel'
import { modelBusinessCategory } from '../../models'
import type { IBusinessCategoryInput, IResponseAllBusinessCategory } from '../../types/BusinessCategory'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IBusinessCategoryService {
  validate(data: any): any
  show(pId: number): Promise<IBusinessCategoryInstance | null>
  all(pParam?: any): Promise<IBusinessCategoryInstance[] | IResponseAllBusinessCategory>
  allAdmin(pParam: any): Promise<IResponseAllBusinessCategory | IBusinessCategoryInstance[]>
  create(payload: IBusinessCategoryInput): Promise<IBusinessCategoryInstance>
  update(payload: IBusinessCategoryInput): Promise<IBusinessCategoryInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class BusinessCategoryService implements IBusinessCategoryService {
  async validate(data: any) {
    const dataValidate = modelBusinessCategory.build(data)
    await dataValidate.validate()
  }

  async show(pId: number): Promise<IBusinessCategoryInstance | null> {
    try {
      const vResponse: IBusinessCategoryInstance | null = await modelBusinessCategory.findOne({
        where: { id: pId },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async all(pParam?: any): Promise<IBusinessCategoryInstance[] | IResponseAllBusinessCategory> {
    try {
      const vWhere: any = {}
      if (pParam?.type) {
        vWhere.type = pParam.type
      }
      if (!pParam?.page) {
        const vResponse: IBusinessCategoryInstance[] = await modelBusinessCategory.findAll({
          where: vWhere,
        })
        return vResponse
      }
      const vLimit = Number(pParam.limit) || 10
      const vPage = Number(pParam.page) || 1
      const vOffset = (vPage - 1) * vLimit
      const vCount: number = await modelBusinessCategory.count({ where: vWhere })
      const vResponse: IBusinessCategoryInstance[] = await modelBusinessCategory.findAll({
        where: vWhere,
        limit: vLimit,
        offset: vOffset,
      })
      return {
        total: vCount,
        totalPage: Math.max(Math.ceil(vCount / vLimit), 1),
        data: vResponse,
        actualPage: vPage,
      } as unknown as IResponseAllBusinessCategory
    } catch (error) {
      throw error
    }
  }

  async allAdmin(pParam: any): Promise<IResponseAllBusinessCategory | IBusinessCategoryInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'BusinessCategory'
      )
      if (pParam?.type) {
        whereStatement.where = { ...whereStatement.where, type: pParam.type }
      }
      const vResponse: IBusinessCategoryInstance[] = await modelBusinessCategory.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllBusinessCategory = await fxReponseServices(
          pParam,
          whereStatement,
          'BusinessCategory',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IBusinessCategoryInput): Promise<IBusinessCategoryInstance> {
    try {
      const vResponse: IBusinessCategoryInstance = await modelBusinessCategory.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IBusinessCategoryInput): Promise<IBusinessCategoryInstance | null> {
    try {
      if (pData?.id) {
        const vResponse: IBusinessCategoryInstance | null = await modelBusinessCategory.findOne({
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
      const record = await modelBusinessCategory.update(
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
export default new BusinessCategoryService()
