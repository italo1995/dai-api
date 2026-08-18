/*
- File: StoreDepartmentService.ts

- Purpose: Departamentos de una tienda del Marketplace. Cada tienda maneja su propia lista,
  independiente de las demas. Un producto pertenece a un solo departamento (validado en
  StoreProductService, no aca).

==========Functions Manifest==========
- StoreDepartmentService Methods:
  1 - validate: valida los campos con respecto al modelo
  2 - show: trae un departamento por id
  3 - all: lista los departamentos de una tienda (?storeId=X). Publico, no tiene datos sensibles
  4 - allAdmin: version paginada/buscable para <app-list-items vIsAdmin>, misma data que all()
  5 - create: crea un departamento nuevo
  6 - update: actualiza un departamento existente
  7 - softDeleteRecord: elimina (soft delete) un departamento
*/
import { type FindOptions } from 'sequelize'
import type { IStoreDepartmentInstance } from '../../models/Store/StoreDepartmentModel'
import { modelStoreDepartment } from '../../models'
import type { IStoreDepartmentInput, IResponseAllStoreDepartment } from '../../types/StoreDepartment'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IStoreDepartmentService {
  validate(data: any): any
  show(pId: number): Promise<IStoreDepartmentInstance | null>
  all(pStoreId: number): Promise<IStoreDepartmentInstance[]>
  allAdmin(pParam: any): Promise<IResponseAllStoreDepartment | IStoreDepartmentInstance[]>
  create(payload: IStoreDepartmentInput): Promise<IStoreDepartmentInstance>
  update(payload: IStoreDepartmentInput): Promise<IStoreDepartmentInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class StoreDepartmentService implements IStoreDepartmentService {
  async validate(data: any) {
    const dataValidate = modelStoreDepartment.build(data)
    await dataValidate.validate()
  }

  async show(pId: number): Promise<IStoreDepartmentInstance | null> {
    try {
      const vResponse: IStoreDepartmentInstance | null = await modelStoreDepartment.findOne({
        where: { id: pId },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async all(pStoreId: number): Promise<IStoreDepartmentInstance[]> {
    try {
      const vResponse: IStoreDepartmentInstance[] = await modelStoreDepartment.findAll({
        where: { storeId: pStoreId },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async allAdmin(pParam: any): Promise<IResponseAllStoreDepartment | IStoreDepartmentInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'StoreDepartment'
      )
      if (pParam?.storeId) {
        whereStatement.where = { ...whereStatement.where, storeId: Number(pParam.storeId) }
      }
      const vResponse: IStoreDepartmentInstance[] = await modelStoreDepartment.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllStoreDepartment = await fxReponseServices(
          pParam,
          whereStatement,
          'StoreDepartment',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IStoreDepartmentInput): Promise<IStoreDepartmentInstance> {
    try {
      const vResponse: IStoreDepartmentInstance = await modelStoreDepartment.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IStoreDepartmentInput): Promise<IStoreDepartmentInstance | null> {
    try {
      if (pData?.id) {
        const vResponse: IStoreDepartmentInstance | null = await modelStoreDepartment.findOne({
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
      const record = await modelStoreDepartment.update(
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
export default new StoreDepartmentService()
