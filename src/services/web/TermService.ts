/* 
- File: TermService.ts

- Purpose: El serivicio Terms se encarga de las consultas con los modelos y funcionalidades relacionadas al Terminos

- Author: Italo belen

- Creation: 06/03/2024  

==========Functions Manifest==========
- TermService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import type { ITermInstance } from '../../models/web/TermModel'
import { modelTerm } from '../../models'
import type { ITermInput, IResponseAllTerm } from '../../types/webTypes'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface ITermTerm {
  validate(data: any): any
  show(pId: number): Promise<ITermInstance | null>
  all(pParam: any): Promise<IResponseAllTerm | ITermInstance[]>
  create(payload: ITermInput): Promise<ITermInstance>
  update(payload: ITermInput): Promise<ITermInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class TermTerm implements ITermTerm {
  async validate(data: any) {
    const dataValidate = modelTerm.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllTerm | ITermInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name', modelTerm.name
      )

      const vResponse: ITermInstance[] = await modelTerm.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllTerm = await fxReponseServices(
          pParam,
          whereStatement,
          'Term',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<ITermInstance | null> {
    try {
      const vResponse: ITermInstance | null = await modelTerm.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: ITermInput): Promise<ITermInstance> {
    try {
      const vResponse: ITermInstance = await modelTerm.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: ITermInput): Promise<ITermInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: ITermInstance | null = await modelTerm.findOne({
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
      const record = await modelTerm.update({ deletedAt: new Date() }, {
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
export default new TermTerm()