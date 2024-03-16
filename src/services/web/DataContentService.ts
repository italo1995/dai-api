/* 
- File: DataContent.ts

- Purpose: El serivicio DataContent se encarga de las consultas con los modelos y funcionalidades relacionadas a todas las diferentes zonas que se encargan de proporcionar informacion al cliente

- Author: Jairo belen

- Creation: 16/03/2024  

==========Functions Manifest==========
- TermsTerm Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import type { IDataContentInstance } from '../../models/web/DataContentModel'
import { modelDataContent } from '../../models'
import type { IDataContentInput, IResponseAllDataContent } from '../../types/webTypes'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IDataContent {
  validate(data: any): any
  show(pId: number): Promise<IDataContentInstance | null>
  all(pParam: any): Promise<IResponseAllDataContent | IDataContentInstance[]>
  create(payload: IDataContentInput): Promise<IDataContentInstance>
  update(payload: IDataContentInput): Promise<IDataContentInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class DataContent implements IDataContent {
  async validate(data: any) {
    const dataValidate = modelDataContent.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllDataContent | IDataContentInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name', modelDataContent.name
      )

      const vResponse: IDataContentInstance[] = await modelDataContent.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllDataContent = await fxReponseServices(
          pParam,
          whereStatement,
          'DataContent',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IDataContentInstance | null> {
    try {
      const vResponse: IDataContentInstance | null = await modelDataContent.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IDataContentInput): Promise<IDataContentInstance> {
    try {
      const vResponse: IDataContentInstance = await modelDataContent.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IDataContentInput): Promise<IDataContentInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: IDataContentInstance | null = await modelDataContent.findOne({
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
      const record = await modelDataContent.update({ deletedAt: new Date() }, {
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
export default new DataContent()