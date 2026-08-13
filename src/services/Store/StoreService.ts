/*
- File: StoreService.ts

- Purpose: Servicio de tiendas/comercios del Marketplace (DAI Food / DAI Market). Se encarga de
  las consultas con el modelo y de las reglas de negocio: aprobacion por admin antes de ser
  visible en la app, y scoping por dueño para el rol 'store'.

==========Functions Manifest==========
- StoreService Methods:
  1 - validate: valida los campos con respecto al modelo
  2 - show: trae una tienda por id
  3 - all: version publica para la app/cliente. Solo tiendas aprobadas (isApproved=true)
  4 - allAdmin: version para el panel. Si se pasa pOwnerId, se restringe a las tiendas de ese
      dueño (rol 'store'); si no, devuelve todas (rol admin/operator), con filtro opcional por
      estado de aprobacion y paginacion/busqueda
  5 - create: crea una tienda nueva, queda pendiente de aprobacion (isApproved=null)
  6 - update: actualiza una tienda existente
  7 - approve: marca una tienda como aprobada, limpia el motivo de rechazo
  8 - reject: marca una tienda como rechazada, exige el motivo
  9 - softDeleteRecord: elimina (soft delete) una tienda
*/
import { type FindOptions } from 'sequelize'
import type { IStoreInstance } from '../../models/Store/StoreModel'
import { modelStore } from '../../models'
import type { IStoreInput, IResponseAllStore, IStorePublic } from '../../types/Store'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IStoreService {
  validate(data: any): any
  show(pId: number): Promise<IStoreInstance | null>
  all(): Promise<IStorePublic[]>
  allAdmin(pParam: any, pOwnerId?: string): Promise<IResponseAllStore | IStoreInstance[]>
  create(payload: IStoreInput): Promise<IStoreInstance>
  update(payload: IStoreInput): Promise<IStoreInstance | null>
  approve(pId: number): Promise<IStoreInstance | null>
  reject(pId: number, pReason: string): Promise<IStoreInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class StoreService implements IStoreService {
  async validate(data: any) {
    const dataValidate = modelStore.build(data)
    await dataValidate.validate()
  }

  // Endpoint publico consumido por la app: solo tiendas aprobadas por el admin.
  public async all(): Promise<IStorePublic[]> {
    try {
      const vResponse: IStoreInstance[] = await modelStore.findAll({
        where: { isApproved: true },
        attributes: ['id', 'name', 'type', 'logo', 'lat', 'lon', 'cityId', 'isOpen', 'avgPrepTimeMinutes'],
      })
      return vResponse as unknown as IStorePublic[]
    } catch (error) {
      throw error
    }
  }

  public async allAdmin(
    pParam: any,
    pOwnerId?: string
  ): Promise<IResponseAllStore | IStoreInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'Store'
      )
      if (pOwnerId) {
        whereStatement.where = { ...whereStatement.where, ownerId: pOwnerId }
      } else if (pParam?.isApproved === 'true') {
        whereStatement.where = { ...whereStatement.where, isApproved: true }
      } else if (pParam?.isApproved === 'false') {
        whereStatement.where = { ...whereStatement.where, isApproved: false }
      } else if (pParam?.isApproved === 'pending') {
        whereStatement.where = { ...whereStatement.where, isApproved: null }
      }

      const vResponse: IStoreInstance[] = await modelStore.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllStore = await fxReponseServices(
          pParam,
          whereStatement,
          'Store',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IStoreInstance | null> {
    try {
      const vResponse: IStoreInstance | null = await modelStore.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IStoreInput): Promise<IStoreInstance> {
    try {
      const vResponse: IStoreInstance = await modelStore.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IStoreInput): Promise<IStoreInstance | null> {
    try {
      if (pData?.id) {
        const vResponse: IStoreInstance | null = await modelStore.findOne({
          where: {
            id: pData.id,
          },
        })
        await vResponse?.update(pData)
        return vResponse
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async approve(pId: number): Promise<IStoreInstance | null> {
    try {
      const vResponse: IStoreInstance | null = await modelStore.findOne({ where: { id: pId } })
      await vResponse?.update({ isApproved: true, rejectionReason: null })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async reject(pId: number, pReason: string): Promise<IStoreInstance | null> {
    try {
      const vResponse: IStoreInstance | null = await modelStore.findOne({ where: { id: pId } })
      await vResponse?.update({ isApproved: false, rejectionReason: pReason })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async softDeleteRecord(pId: number) {
    try {
      const record = await modelStore.update(
        { deletedAt: new Date() },
        {
          where: { id: pId },
        }
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
export default new StoreService()
