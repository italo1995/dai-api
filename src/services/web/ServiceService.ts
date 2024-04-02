/* 
- File: ServiceService.ts

- Purpose: El serivicio Service se encarga de las consultas con los modelos y funcionalidades relacionadas al Service

- Author: Jairo Belen

- Creation: 30/01/2024  

==========Functions Manifest==========
- serviceService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import type { IServiceInstance } from '../../models/web/ServiceModel'
import { modelService } from '../../models'
import type { INewInput, IResponseAllService } from '../../types/webTypes'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IServiceService {
  validate(data: any): any
  show(pId: number): Promise<IServiceInstance | null>
  all(pParam: any): Promise<IResponseAllService | IServiceInstance[]>
  create(payload: INewInput): Promise<IServiceInstance>
  update(payload: INewInput): Promise<IServiceInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class ServiceService implements IServiceService {
  async validate(data: any) {
    const dataValidate = modelService.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllService | IServiceInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'Service'
      )

      const vResponse: IServiceInstance[] = await modelService.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllService = await fxReponseServices(
          pParam,
          whereStatement,
          'service',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IServiceInstance | null> {
    try {
      const vResponse: IServiceInstance | null = await modelService.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: INewInput): Promise<IServiceInstance> {
    try {
      const vResponse: IServiceInstance = await modelService.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: INewInput): Promise<IServiceInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: IServiceInstance | null = await modelService.findOne({
          where: {
            id: pData.id,
          },
        })
        await vCountry?.update(pData, { where: { id: pData.id } })
        return vCountry
      }
      return null
    } catch (error) {
      throw error
    }
  }
  async softDeleteRecord(pId: number) {
    try {
      const record = await modelService.update(
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
export default new ServiceService()
