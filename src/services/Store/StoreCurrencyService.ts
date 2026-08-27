/*
- File: StoreCurrencyService.ts

- Purpose: Monedas aceptadas por una tienda del Marketplace, cada una con su propia tasa de
  cambio (independiente de currencies.change, que es global del modulo de traslados). Cada
  tienda administra su propia lista, igual que Departamentos/Categorias.

==========Functions Manifest==========
- StoreCurrencyService Methods:
  1 - validate: valida los campos con respecto al modelo
  2 - show: trae una moneda de tienda por id
  3 - all: lista las monedas de una tienda (?storeId=X), con el nombre/simbolo de la moneda
      incluido. Publico, no tiene datos sensibles
  4 - allAdmin: version paginada/buscable para <app-list-items vIsAdmin>
  5 - create: agrega una moneda a una tienda. Si isDefault=true, le quita el default a las demas
      de esa misma tienda
  6 - update: actualiza una moneda de tienda existente (misma logica de isDefault que create)
  7 - softDeleteRecord: elimina (soft delete) una moneda de tienda
*/
import { Op, type FindOptions } from 'sequelize'
import type { IStoreCurrencyInstance } from '../../models/Store/StoreCurrencyModel'
import { modelStoreCurrency, modelCurrency } from '../../models'
import type { IStoreCurrencyInput, IResponseAllStoreCurrency } from '../../types/StoreCurrency'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

const vCurrencyInclude = {
  model: modelCurrency,
  as: 'currency',
  attributes: ['id', 'name', 'symbol'],
}

class StoreCurrencyService {
  async validate(data: any) {
    const dataValidate = modelStoreCurrency.build(data)
    await dataValidate.validate()
  }

  async show(pId: number): Promise<IStoreCurrencyInstance | null> {
    try {
      const vResponse: IStoreCurrencyInstance | null = await modelStoreCurrency.findOne({
        where: { id: pId },
        include: [vCurrencyInclude],
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async all(pStoreId: number): Promise<IStoreCurrencyInstance[]> {
    try {
      const vResponse: IStoreCurrencyInstance[] = await modelStoreCurrency.findAll({
        where: { storeId: pStoreId },
        include: [vCurrencyInclude],
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async allAdmin(pParam: any): Promise<IResponseAllStoreCurrency | IStoreCurrencyInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement, pParam?.typeSearch || 'id', 'StoreCurrency')
      if (pParam?.storeId) {
        whereStatement.where = { ...whereStatement.where, storeId: Number(pParam.storeId) }
      }
      whereStatement.include = [vCurrencyInclude]
      const vResponse: IStoreCurrencyInstance[] = await modelStoreCurrency.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllStoreCurrency = await fxReponseServices(
          pParam,
          whereStatement,
          'StoreCurrency',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  // Solo una moneda default por tienda a la vez - si se marca esta, se le quita el default a
  // las demas de la misma tienda (no hay constraint de DB para esto, se resuelve aca).
  private async fxUnsetOtherDefaults(pStoreId: number, pExceptId?: number) {
    await modelStoreCurrency.update(
      { isDefault: false },
      {
        where: {
          storeId: pStoreId,
          ...(pExceptId ? { id: { [Op.ne]: pExceptId } } : {}),
        },
      }
    )
  }

  async create(pData: IStoreCurrencyInput): Promise<IStoreCurrencyInstance> {
    try {
      const vResponse: IStoreCurrencyInstance = await modelStoreCurrency.create(pData)
      if (pData.isDefault) {
        await this.fxUnsetOtherDefaults(pData.storeId, vResponse.dataValues.id)
      }
      return (await this.show(vResponse.dataValues.id)) as IStoreCurrencyInstance
    } catch (error) {
      throw error
    }
  }

  async update(pData: IStoreCurrencyInput): Promise<IStoreCurrencyInstance | null> {
    try {
      if (pData?.id) {
        const vResponse: IStoreCurrencyInstance | null = await modelStoreCurrency.findOne({
          where: { id: pData.id },
        })
        if (!vResponse) {
          return null
        }
        await vResponse.update(pData)
        if (pData.isDefault) {
          await this.fxUnsetOtherDefaults(vResponse.dataValues.storeId, vResponse.dataValues.id)
        }
        return await this.show(vResponse.dataValues.id)
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async softDeleteRecord(pId: number) {
    try {
      const record = await modelStoreCurrency.update(
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
export default new StoreCurrencyService()
