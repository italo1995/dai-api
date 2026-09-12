/*
- File: MediaLibraryItemService.ts

- Purpose: Libreria de iconos/imagenes genericos (hoy solo type='payment_method'). Solo
  admin/operator la administran; lectura es publica para que cualquier form (ej: crear un metodo
  de pago de tienda) pueda ofrecer "elegir de la libreria" sin exponer nada sensible.

==========Functions Manifest==========
- MediaLibraryItemService Methods:
  1 - validate: valida los campos con respecto al modelo
  2 - show: trae un item por id
  3 - all: version publica, filtrada por ?type= (y por defecto solo isActive=true, salvo que se
      pida explicitamente lo contrario con ?includeInactive=true)
  4 - allAdmin: version paginada/buscable para <app-list-items vIsAdmin>
  5 - create: crea un item nuevo
  6 - update: actualiza un item existente
  7 - softDeleteRecord: elimina (soft delete) un item
*/
import { type FindOptions } from 'sequelize'
import type { IMediaLibraryItemInstance } from '../../models/Media/MediaLibraryItemModel'
import { modelMediaLibraryItem } from '../../models'
import type { IMediaLibraryItemInput, IResponseAllMediaLibraryItem } from '../../types/MediaLibraryItem'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

class MediaLibraryItemService {
  async validate(data: any) {
    const dataValidate = modelMediaLibraryItem.build(data)
    await dataValidate.validate()
  }

  async show(pId: number): Promise<IMediaLibraryItemInstance | null> {
    try {
      const vResponse: IMediaLibraryItemInstance | null = await modelMediaLibraryItem.findOne({
        where: { id: pId },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async all(pParam?: any): Promise<IMediaLibraryItemInstance[]> {
    try {
      const vWhere: any = {}
      if (pParam?.type) {
        vWhere.type = pParam.type
      }
      if (!pParam?.includeInactive) {
        vWhere.isActive = true
      }
      const vResponse: IMediaLibraryItemInstance[] = await modelMediaLibraryItem.findAll({
        where: vWhere,
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async allAdmin(pParam: any): Promise<IResponseAllMediaLibraryItem | IMediaLibraryItemInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement, pParam?.typeSearch || 'name', 'MediaLibraryItem')
      if (pParam?.type) {
        whereStatement.where = { ...whereStatement.where, type: pParam.type }
      }
      const vResponse: IMediaLibraryItemInstance[] = await modelMediaLibraryItem.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllMediaLibraryItem = await fxReponseServices(
          pParam,
          whereStatement,
          'MediaLibraryItem',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IMediaLibraryItemInput): Promise<IMediaLibraryItemInstance> {
    try {
      const vResponse: IMediaLibraryItemInstance = await modelMediaLibraryItem.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IMediaLibraryItemInput): Promise<IMediaLibraryItemInstance | null> {
    try {
      if (pData?.id) {
        const vResponse: IMediaLibraryItemInstance | null = await modelMediaLibraryItem.findOne({
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
      const record = await modelMediaLibraryItem.update(
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
export default new MediaLibraryItemService()
