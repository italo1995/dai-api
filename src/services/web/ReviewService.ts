/* 
- File: ReviewService.ts

- Purpose: El serivicio Review se encarga de las consultas con modelos y funcionalidades al Review

- Author: Jairo Belen

- Creation: 31/01/2024  

==========Functions Manifest==========
- ReviewService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import { ETypeReview, type IReviewInstance } from '../../models/web/ReviewModel'
import { modelReview, modelUser } from '../../models'
import type { IReviewInput, IResponseAllReview } from '../../types/webTypes'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IReviewService {
  validate(data: any): any
  show(pId: number): Promise<IReviewInstance | null>
  all(pParam: any): Promise<IResponseAllReview | IReviewInstance[]>
  create(payload: IReviewInput): Promise<IReviewInstance>
  update(payload: IReviewInput): Promise<IReviewInstance | null>
  softDeleteRecord(pId: number): Promise<boolean>
}

class ReviewService implements IReviewService {
  async validate(data: any) {
    const dataValidate = modelReview.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllReview | IReviewInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        'Review'
      )
      if (pParam?.clientId) {
        whereStatement.where = {
          ...whereStatement.where,
          clientId: pParam.clientId,
          type: ETypeReview.DRIVER,
        }
      }else if (pParam?.driverId) {
        whereStatement.where = {
          ...whereStatement.where,
          driverId: pParam.driverId,
          type: ETypeReview.PASSENGER,
        }
      }else if (pParam?.type) {
        whereStatement.where = {
          ...whereStatement.where,
          type: pParam.type,
        }
      }
      whereStatement.include = [
        {
          model: modelUser,
          as: 'client',
          attributes: ['name', 'avatar'],
        },
        {
          model: modelUser,
          as: 'driver',
          attributes: ['name', 'avatar'],
        }
      ]
      const vResponse: IReviewInstance[] = await modelReview.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllReview = await fxReponseServices(
          pParam,
          whereStatement,
          'Review',
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<IReviewInstance | null> {
    try {
      const vResponse: IReviewInstance | null = await modelReview.findOne({
        where: {
          id: pId,
        },
        include: [
          {
            model: modelUser,
            as: 'client',
            attributes: ['name', 'avatar'],
          },
          {
            model: modelUser,
            as: 'driver',
            attributes: ['name', 'avatar'],
          }
        ]
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: IReviewInput): Promise<IReviewInstance> {
    try {
      const vReview: IReviewInstance = await modelReview.create(pData)
      return vReview
    } catch (error) {
      throw error
    }
  }

  async update(pData: IReviewInput): Promise<IReviewInstance | null> {
    try {
      if (pData?.id) {
        const vReponse: IReviewInstance | null = await modelReview.findOne({
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
      const record = await modelReview.update(
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
export default new ReviewService()
