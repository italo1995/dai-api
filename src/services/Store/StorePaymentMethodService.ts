/*
- File: StorePaymentMethodService.ts

- Purpose: Metodos de pago que acepta una tienda del Marketplace (efectivo, transferencia,
  zelle, nequi, pago movil, otro) - lista dinamica por tienda, sin relacion con el catalogo
  global PaymentMethod (ese es del modulo de traslados).

==========Functions Manifest==========
- StorePaymentMethodService Methods:
  1 - validate: valida los campos con respecto al modelo
  2 - show: trae un metodo de pago de tienda por id
  3 - all: lista los metodos de pago de una tienda (?storeId=X). Publico, no tiene datos sensibles
  4 - allAdmin: version paginada/buscable para <app-list-items vIsAdmin>
  5 - create: agrega un metodo de pago a una tienda
  6 - update: actualiza un metodo de pago existente
  7 - softDeleteRecord: elimina (soft delete) un metodo de pago
*/
import { type FindOptions } from 'sequelize'
import type { IStorePaymentMethodInstance } from '../../models/Store/StorePaymentMethodModel'
import { modelStorePaymentMethod } from '../../models'
import type { IStorePaymentMethodInput, IResponseAllStorePaymentMethod } from '../../types/StorePaymentMethod'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

class StorePaymentMethodService {
  async validate(data: any) {
    const dataValidate = modelStorePaymentMethod.build(data)
    await dataValidate.validate()
  }

  async show(pId: number): Promise<IStorePaymentMethodInstance | null> {
    try {
      const vResponse: IStorePaymentMethodInstance | null = await modelStorePaymentMethod.findOne({
        where: { id: pId },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async all(pStoreId: number): Promise<IStorePaymentMethodInstance[]> {
    try {
      const vResponse: IStorePaymentMethodInstance[] = await modelStorePaymentMethod.findAll({
        where: { storeId: pStoreId },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async allAdmin(pParam: any): Promise<IResponseAllStorePaymentMethod | IStorePaymentMethodInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement, pParam?.typeSearch || 'type', 'StorePaymentMethod')
      if (pParam?.storeId) {
        whereStatement.where = { ...whereStatement.where, storeId: Number(pParam.storeId) }
      }
      const vResponse: IStorePaymentMethodInstance[] = await modelStorePaymentMethod.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllStorePaymentMethod = await fxReponseServices(
          pParam,
          whereStatement,
          'StorePaymentMethod',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IStorePaymentMethodInput): Promise<IStorePaymentMethodInstance> {
    try {
      const vResponse: IStorePaymentMethodInstance = await modelStorePaymentMethod.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IStorePaymentMethodInput): Promise<IStorePaymentMethodInstance | null> {
    try {
      if (pData?.id) {
        const vResponse: IStorePaymentMethodInstance | null = await modelStorePaymentMethod.findOne({
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
      const record = await modelStorePaymentMethod.update(
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
export default new StorePaymentMethodService()
