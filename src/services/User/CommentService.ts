/* 
- File: CommentService.ts

- Purpose: El serivicio Comment se encarga de las consultas con los comentarios y funcionalidades relacionadas

- Author: Jairo belen

- Creation: 17/03/2024  

==========Functions Manifest==========
- CommentService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import type { ICommentInstance } from '../../models/User/CommentModel'
import {  modelComment } from '../../models'
import type { ICommentInput, IResponseAllComment } from '../../types/User'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IComment {
  validate(data: any): any
  show(pId: number): Promise<ICommentInstance | null>
  all(pParam: any): Promise<IResponseAllComment | ICommentInstance[]>
  create(payload: ICommentInput): Promise<ICommentInstance>
  update(payload: ICommentInput): Promise<ICommentInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class Comment implements IComment {
  async validate(data: any) {
    const dataValidate = modelComment.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllComment | ICommentInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name', modelComment.name
      )

      if (pParam?.type) {
        (whereStatement.where as any)['type'] = pParam.type
      }
      
      whereStatement.include = [
        {
          model: modelComment,
          as: 'children',
          foreignKey: 'parentId'
        }
      ]
      const vResponse: ICommentInstance[] = await modelComment.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllComment = await fxReponseServices(
          pParam,
          whereStatement,
          'Comment',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<ICommentInstance | null> {
    try {
      const vResponse: ICommentInstance | null = await modelComment.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: ICommentInput): Promise<ICommentInstance> {
    try {
      const vResponse: ICommentInstance = await modelComment.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: ICommentInput): Promise<ICommentInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: ICommentInstance | null = await modelComment.findOne({
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
      const record = await modelComment.update({ deletedAt: new Date() }, {
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
export default new Comment()