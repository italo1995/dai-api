/* 
- File: TripRouteService.ts

- Purpose: 

- Author: Jairo Belen

- Creation: 06/02/2024  

==========Functions Manifest==========

- TripService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del item segun el id
  3 - create: crea datos del item
  4 - update: actualiza datos del item
*/
import { type FindOptions } from 'sequelize'
import { modelTrip, modelTripRoute } from '../../models'
import type { ITripRouteInstance } from '../../models/Trip/TripRouteModel'
import type { ITripRouteInput, IResponseAllTripRoute } from '../../types/TripType'
import { fxOrderNameId, fxPaginate, fxSearchILike, fxReponseServices } from '../../utils/query'

interface ITripRouteService {
  validate(data: any): any
  show(pId: number): Promise<ITripRouteInstance | null>
  create(payload: ITripRouteInput): Promise<ITripRouteInstance>
  createMany(payload: ITripRouteInput[]): Promise<ITripRouteInstance[]>
  update(payload: ITripRouteInput): Promise<ITripRouteInstance | null>
}

class TripRouteService implements ITripRouteService {
  async validate(data: any) {
    const dataValidate = modelTripRoute.build(data)
    await dataValidate.validate()
  }

  public async all(pParam: any): Promise<IResponseAllTripRoute | ITripRouteInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(pParam, whereStatement,pParam?.typeSearch || 'name',
        'TripRoute'
      )

      const vResponse: ITripRouteInstance[] = await modelTripRoute.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllTripRoute = await fxReponseServices(pParam, whereStatement, 'TripRoute', vResponse)
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  public async recient(pParam: any): Promise<IResponseAllTripRoute | ITripRouteInstance[]> {
    try {
      const whereStatement: FindOptions = {}
      const limit = Number(pParam?.limit) || 10 // Define cuantos registros por pagina quieres mostrar
      whereStatement.limit = limit
      whereStatement.order = [
        ['createdAt', 'DESC']
      ]
      whereStatement.include = [
        {
          model: modelTrip,
          as: 'trip',
          required: false,
        }
      ]
      const vResponse: ITripRouteInstance[] = await modelTripRoute.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllTripRoute = await fxReponseServices(pParam, whereStatement, 'TripRoute', vResponse)
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pId: number): Promise<ITripRouteInstance | null> {
    try {
      const vResponse: ITripRouteInstance | null = await modelTripRoute.findOne({
        where: {
          id: pId,
        },
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async create(pData: ITripRouteInput): Promise<ITripRouteInstance> {
    try {
      const vResponse: ITripRouteInstance = await modelTripRoute.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async createMany(pData: ITripRouteInput[]): Promise<ITripRouteInstance[]> {
    try {
      const vResponse: ITripRouteInstance[] = await modelTripRoute.bulkCreate(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: ITripRouteInput): Promise<ITripRouteInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: ITripRouteInstance | null = await modelTripRoute.findOne({
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
}
export default new TripRouteService()   

