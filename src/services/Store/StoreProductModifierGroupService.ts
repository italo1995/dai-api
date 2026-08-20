/*
- File: StoreProductModifierGroupService.ts

- Purpose: Grupos de modificadores de un producto (ej: "¿Como la quieres?", "Adicionales") y sus
  opciones. Cada grupo maneja su propia lista de opciones (store_product_modifiers) - se
  reemplaza por completo en cada update del grupo (destroy + bulkCreate), igual que las
  categorias de un producto, no se maneja opcion por opcion.

==========Functions Manifest==========
- StoreProductModifierGroupService Methods:
  1 - validate: valida los campos con respecto al modelo
  2 - show: trae un grupo por id, con sus opciones
  3 - all: lista publica de los grupos (con opciones) de un producto (?productId=X). Publico,
      la usa la app para armar la pantalla de detalle del producto
  4 - allAdmin: version paginada/buscable para <app-list-items vIsAdmin>
  5 - create: crea un grupo nuevo con sus opciones
  6 - update: actualiza un grupo existente y reemplaza sus opciones
  7 - softDeleteRecord: elimina (soft delete) un grupo
*/
import { type FindOptions } from 'sequelize'
import type { IStoreProductModifierGroupInstance } from '../../models/Store/StoreProductModifierGroupModel'
import { modelStoreProductModifierGroup, modelStoreProductModifier } from '../../models'
import type {
  IStoreProductModifierGroupInput,
  IResponseAllStoreProductModifierGroup,
} from '../../types/StoreProductModifierGroup'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'
import sequelize from '../../models'

const vModifiersInclude = {
  model: modelStoreProductModifier,
  as: 'modifiers',
  attributes: ['id', 'name', 'extraPrice'],
}

interface IStoreProductModifierGroupService {
  validate(data: any): any
  show(pId: number): Promise<IStoreProductModifierGroupInstance | null>
  all(pProductId: number): Promise<IStoreProductModifierGroupInstance[]>
  allAdmin(pParam: any): Promise<IResponseAllStoreProductModifierGroup | IStoreProductModifierGroupInstance[]>
  create(payload: IStoreProductModifierGroupInput): Promise<IStoreProductModifierGroupInstance>
  update(payload: IStoreProductModifierGroupInput): Promise<IStoreProductModifierGroupInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class StoreProductModifierGroupService implements IStoreProductModifierGroupService {
  async validate(data: any) {
    const dataValidate = modelStoreProductModifierGroup.build(data)
    await dataValidate.validate()
  }

  async show(pId: number): Promise<IStoreProductModifierGroupInstance | null> {
    try {
      const vResponse: IStoreProductModifierGroupInstance | null = await modelStoreProductModifierGroup.findOne({
        where: { id: pId },
        include: [vModifiersInclude],
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async all(pProductId: number): Promise<IStoreProductModifierGroupInstance[]> {
    try {
      const vResponse: IStoreProductModifierGroupInstance[] = await modelStoreProductModifierGroup.findAll({
        where: { productId: pProductId },
        include: [vModifiersInclude],
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async allAdmin(
    pParam: any
  ): Promise<IResponseAllStoreProductModifierGroup | IStoreProductModifierGroupInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'StoreProductModifierGroup'
      )
      if (pParam?.productId) {
        whereStatement.where = { ...whereStatement.where, productId: Number(pParam.productId) }
      }
      whereStatement.include = [vModifiersInclude]
      const vResponse: IStoreProductModifierGroupInstance[] = await modelStoreProductModifierGroup.findAll(
        whereStatement
      )
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllStoreProductModifierGroup = await fxReponseServices(
          pParam,
          whereStatement,
          'StoreProductModifierGroup',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  private async fxSetModifiers(pGroupId: number, pModifiers: { name: string; extraPrice: number }[]) {
    await sequelize.transaction(async (pTransaction) => {
      await modelStoreProductModifier.destroy({ where: { groupId: pGroupId }, transaction: pTransaction })
      if (pModifiers?.length) {
        await modelStoreProductModifier.bulkCreate(
          pModifiers.map((pModifier) => ({
            groupId: pGroupId,
            name: pModifier.name,
            extraPrice: pModifier.extraPrice || 0,
          })),
          { transaction: pTransaction }
        )
      }
    })
  }

  async create(pData: IStoreProductModifierGroupInput): Promise<IStoreProductModifierGroupInstance> {
    try {
      const { modifiers, ...vGroupData } = pData
      const vResponse: IStoreProductModifierGroupInstance = await modelStoreProductModifierGroup.create(vGroupData)
      await this.fxSetModifiers(vResponse.dataValues.id, modifiers ?? [])
      return (await this.show(vResponse.dataValues.id)) as IStoreProductModifierGroupInstance
    } catch (error) {
      throw error
    }
  }

  async update(pData: IStoreProductModifierGroupInput): Promise<IStoreProductModifierGroupInstance | null> {
    try {
      if (pData?.id) {
        const vExisting: IStoreProductModifierGroupInstance | null = await modelStoreProductModifierGroup.findOne({
          where: { id: pData.id },
        })
        if (!vExisting) {
          return null
        }
        const { modifiers, ...vGroupData } = pData
        await vExisting.update(vGroupData)
        if (modifiers !== undefined) {
          await this.fxSetModifiers(vExisting.dataValues.id, modifiers)
        }
        return await this.show(vExisting.dataValues.id)
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async softDeleteRecord(pId: number) {
    try {
      const record = await modelStoreProductModifierGroup.update(
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
export default new StoreProductModifierGroupService()
