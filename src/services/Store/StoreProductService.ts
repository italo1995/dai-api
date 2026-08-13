/*
- File: StoreProductService.ts

- Purpose: Catalogo de productos de una tienda del Marketplace. El endpoint publico solo
  muestra productos disponibles de tiendas aprobadas (join contra stores.is_approved); el panel
  filtra por dueño (rol 'store') o por cualquier tienda (admin/operator).

==========Functions Manifest==========
- StoreProductService Methods:
  1 - validate: valida los campos con respecto al modelo
  2 - show: trae un producto por id
  3 - all: version publica para la app/cliente, filtrada por storeId, solo isAvailable=true y
      de tiendas aprobadas
  4 - allAdmin: version para el panel, filtrada por storeId y opcionalmente por dueño
  5 - create: crea un producto nuevo
  6 - update: actualiza un producto existente
  7 - softDeleteRecord: elimina (soft delete) un producto
*/
import { type FindOptions } from 'sequelize'
import type { IStoreProductInstance } from '../../models/Store/StoreProductModel'
import { modelStoreProduct, modelStore } from '../../models'
import type { IStoreProductInput, IResponseAllStoreProduct, IStoreProductPublic } from '../../types/StoreProduct'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IStoreProductService {
  validate(data: any): any
  show(pId: number): Promise<IStoreProductInstance | null>
  all(pStoreId: number): Promise<IStoreProductPublic[]>
  allAdmin(pParam: any, pOwnerId?: string): Promise<IResponseAllStoreProduct | IStoreProductInstance[]>
  create(payload: IStoreProductInput): Promise<IStoreProductInstance>
  update(payload: IStoreProductInput): Promise<IStoreProductInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class StoreProductService implements IStoreProductService {
  async validate(data: any) {
    const dataValidate = modelStoreProduct.build(data)
    await dataValidate.validate()
  }

  public async all(pStoreId: number): Promise<IStoreProductPublic[]> {
    try {
      const vResponse: IStoreProductInstance[] = await modelStoreProduct.findAll({
        where: { storeId: pStoreId, isAvailable: true },
        attributes: [
          'id',
          'name',
          'description',
          'price',
          'currencyId',
          'image',
          'category',
          'isInventoryable',
          'stockQuantity',
        ],
        include: [
          {
            model: modelStore,
            as: 'store',
            required: true,
            attributes: [],
            where: { isApproved: true },
          },
        ],
      })
      return vResponse as unknown as IStoreProductPublic[]
    } catch (error) {
      throw error
    }
  }

  public async allAdmin(
    pParam: any,
    pOwnerId?: string
  ): Promise<IResponseAllStoreProduct | IStoreProductInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'StoreProduct'
      )
      if (pParam?.storeId) {
        whereStatement.where = { ...whereStatement.where, storeId: Number(pParam.storeId) }
      }
      if (pOwnerId) {
        whereStatement.include = [
          {
            model: modelStore,
            as: 'store',
            required: true,
            attributes: [],
            where: { ownerId: pOwnerId },
          },
        ]
      }

      const vResponse: IStoreProductInstance[] = await modelStoreProduct.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllStoreProduct = await fxReponseServices(
          pParam,
          whereStatement,
          'StoreProduct',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IStoreProductInstance | null> {
    try {
      const vResponse: IStoreProductInstance | null = await modelStoreProduct.findOne({
        where: { id: pId },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IStoreProductInput): Promise<IStoreProductInstance> {
    try {
      const vResponse: IStoreProductInstance = await modelStoreProduct.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IStoreProductInput): Promise<IStoreProductInstance | null> {
    try {
      if (pData?.id) {
        const vResponse: IStoreProductInstance | null = await modelStoreProduct.findOne({
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
      const record = await modelStoreProduct.update(
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
export default new StoreProductService()
