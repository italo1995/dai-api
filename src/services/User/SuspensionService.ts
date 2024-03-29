/* 
- File: SuspensionService.ts

- Purpose: 

- Author: Jairo Belen

- Creation: 28/03/2024  

==========Functions Manifest==========

- CurrencyService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions, Op } from 'sequelize'
import { modelSuspension } from '../../models'
import type { ISuspensionInstance } from '../../models/User/SuspensionModel'
import type { ISuspensionInput, IResponseAllSuspension } from '../../types/User'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface ISuspensionService {
  validate(data: any): any
  all(pParam: any): Promise<IResponseAllSuspension | ISuspensionInstance[]>
  show(pId: number): Promise<ISuspensionInstance | null>
  create(payload: ISuspensionInput): Promise<ISuspensionInstance>
  update(payload: ISuspensionInput): Promise<ISuspensionInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class SuspensionService implements ISuspensionService {
  private modelName = 'Suspension'
  async validate(data: any) {
    const dataValidate = modelSuspension.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllSuspension | ISuspensionInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement,pParam?.typeSearch || 'name',
        this.modelName
      )

      const vResponse: ISuspensionInstance[] = await modelSuspension.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllSuspension = await fxReponseServices(pParam, whereStatement, this.modelName, vResponse)
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<ISuspensionInstance | null> {
    try {
      const vResponse: ISuspensionInstance | null = await modelSuspension.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async findActiveSuspension(driverId: string): Promise<ISuspensionInstance | null> {
    try {
      return await modelSuspension.findOne({
        where: {
          driverId: driverId,
          isCanceled: false,
          end: {
            [Op.gt]: new Date()
          }
        }
      })
    } catch (error) {
      throw error
    }
  }

  async create(pData: ISuspensionInput): Promise<ISuspensionInstance> {
    try {
      const vResponse: ISuspensionInstance = await modelSuspension.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: ISuspensionInput): Promise<ISuspensionInstance | null> {
    try {
      if (pData?.id) {
        const vReponse: ISuspensionInstance | null = await modelSuspension.findOne({
          where: {
            id: pData.id,
          },
        })
        await vReponse?.update(pData, { where: { id: pData.id } })
        return vReponse
      }
      return null
    } catch (error) {
      throw error
    }
  }
  async softDeleteRecord(pId: number) {
    try {
      const record = await modelSuspension.update({ deletedAt: new Date() }, {
        where: { id: pId }
      })
      if (!record) {
        return false
      }
      return true
    } catch (error) {
      throw error
    }
  }
}

export default new SuspensionService()   