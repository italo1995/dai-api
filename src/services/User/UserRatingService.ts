/* 
- File: UserRatingService.ts

- Purpose: El serivicio UserRating se encarga de las consultas con modelos y funcionalidades al sistema de reputacion

- Author: Jairo Belen

- Creation: 19/02/2024  

==========Functions Manifest==========
- VehicleAdditionalService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id, puede usarse en el perfil o para verificar informacion del item
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import type { IUserRatingInstance } from '../../models/User/UserRatingModel'
import { modelUserRating } from '../../models'
import type { IResponseAllUserRating, IUserRatingInput } from '../../types/User'
import ClassReviewService from '../../services/ReviewService'
import { type IResponseAllReview } from '../../types/webTypes'
import { type IReviewInstance } from '../../models/ReviewModel'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface IUserRatingService {
  validate(data: any): any
  all(pParam: any): Promise<IResponseAllUserRating | IUserRatingInstance[]>
  show(pId: number): Promise<IUserRatingInstance | null>
  create(payload: IUserRatingInput): Promise<IUserRatingInstance>
  softDeleteRecord(pId: number): Promise<boolean>
  updateRating(userId: number, type: string): Promise<IUserRatingInstance>
}

class UserRatingService implements IUserRatingService {
  async validate(data: any) {
    const dataValidate = modelUserRating.build(data)
    await dataValidate.validate()
  }

  async show(pId: number): Promise<IUserRatingInstance | null> {
    try {
      const vResponse: IUserRatingInstance | null = await modelUserRating.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  public async all(pParam: any): Promise<IResponseAllUserRating | IUserRatingInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement,pParam?.typeSearch || 'name',
        'UserRating'
      )

      const vResponse: IUserRatingInstance[] = await modelUserRating.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllUserRating = await fxReponseServices(pParam, whereStatement, 'UserRating', vResponse)
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }


  public async updateRating(userId: number, type: string): Promise<IUserRatingInstance> {
    try {
      const response: IResponseAllReview | IReviewInstance[] = await ClassReviewService.all({
        [type + 'Id']: userId,
      })
  
      let sum = 0
      let quantity = 0
  
      if ('data' in response) {
        response.data.forEach((review) => {
          sum += review.qualification
          quantity += 1
        })
      } else if (Array.isArray(response)) {
        response.forEach((review) => {
          sum += review.qualification
          quantity += 1
        })
      }
  
      const averageRating = sum / quantity
  
      // Encuentra el registro de calificación del usuario
      let userRating = await this.show(userId)
  
      // Si el registro de calificación del usuario no existe, lo crea
      if (!userRating) {
        userRating = await this.create({
          userId,
          type,
          ratings: averageRating,
          averageRating: averageRating,
          quantity: quantity,
        })
      } else {
        // Si el registro de calificación del usuario existe, se actualiza
        userRating = await this.update({
          id: userRating.id,
          userId: userId,
          type,
          ratings: averageRating,
          averageRating: averageRating,
          quantity: quantity,
        })
        if (!userRating) {
          throw new Error('No se pudo actualizar la calificación del usuario')
        }
      }
  
      return userRating
    } catch (error) {
      console.error(error)
      throw new Error('Error al actualizar la calificación del usuario')
    }
  }
  async create(pData: IUserRatingInput): Promise<IUserRatingInstance> {
    try {
      const vResponse: IUserRatingInstance = await modelUserRating.create({
        ...pData,
        type: pData.type,
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  
  async update(pData: IUserRatingInput): Promise<IUserRatingInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: IUserRatingInstance | null = await modelUserRating.findOne({
          where: {
            id: pData.id,
          },
        })
        await vCountry?.update({
          ...pData,
          type: pData.type,
        }, { where: { id: pData.id } })
        return vCountry
      }
      return null
    } catch (error) {
      throw error
    }
  }
  async softDeleteRecord(pId: number) {
    try {
      const record = await modelUserRating.update(
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
export default new UserRatingService()
