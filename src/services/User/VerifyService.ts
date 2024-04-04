/* 
- File: VerifyService.ts

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
import { type FindOptions } from 'sequelize'
import { modelVerify } from '../../models'
import type { IVerifyInstance } from '../../models/User/VerifyModel'
import type { IVerifyInput, IResponseAllVerify } from '../../types/User'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IVerifyService {
  validate(data: any): any
  all(pParam: any): Promise<IResponseAllVerify | IVerifyInstance[]>
  show(pId: number): Promise<IVerifyInstance | null>
  create(payload: IVerifyInput): Promise<IVerifyInstance>
  update(payload: IVerifyInput): Promise<IVerifyInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class VerifyService implements IVerifyService {
  private modelName = 'Verify'
  async validate(data: any) {
    const dataValidate = modelVerify.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllVerify | IVerifyInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        this.modelName
      )

      const vResponse: IVerifyInstance[] = await modelVerify.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllVerify = await fxReponseServices(
          pParam,
          whereStatement,
          this.modelName,
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IVerifyInstance | null> {
    try {
      const vResponse: IVerifyInstance | null = await modelVerify.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IVerifyInput): Promise<IVerifyInstance> {
    try {
      const vResponse: IVerifyInstance = await modelVerify.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IVerifyInput): Promise<IVerifyInstance | null> {
    try {
      if (pData?.id) {
        const vReponse: IVerifyInstance | null = await modelVerify.findOne({
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
      const record = await modelVerify.update(
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

export default new VerifyService()
