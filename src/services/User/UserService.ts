import { type FindOptions } from 'sequelize'
import type { IUserInstance } from '../../models/User/User'
import sequelize, { modelDriverDetail, modelUser, modelUserRating } from '../../models'
import { ETypeService } from '../../models/Trip/TripModel'
import { fxOrderNameId, fxPaginate, fxReponseServices, fxSearchILike } from '../../utils/query'
import type { IResponseAllUser, IUserInput } from '../../types/User'

interface IUserService {
  NearbyDrivers(phoneNumber: string, phoneCode: string): Promise<IUserInstance[] | []>
  show(pParam: { id: string, isDriver?: boolean }): Promise<IUserInstance | null>
  all(pParam: any): Promise<IResponseAllUser | IUserInstance[]>
}
export interface NearbyDriversParamTypes {
  lat: string
  lon: string
  distance: number
  typeService: ETypeService
} 
class UserService implements IUserService {
  async validate(data: any) {
    const dataValidate = modelUser.build(data)
    await dataValidate.validate()
  }

  public async NearbyDrivers(pParam: any): Promise<IUserInstance[] | []> {
    try {
      let query = `SELECT temp.*, vehicle_types.is_car, vehicle_types.is_moto FROM (SELECT id, lat, lon, socket_id, status_driver, verified_driver, type_user, token_push, availability_to_travel, vehicle_type, (6371 * acos(cos(radians(${Number(pParam.lat)})) * cos(radians(lat)) * cos(radians(lon) - radians(${Number(pParam.lon)})) + sin(radians(${Number(pParam.lat)})) * sin(radians(lat)))) as distance FROM users) as temp left join vehicle_types on temp.vehicle_type = vehicle_types.id WHERE NOT distance IS NULL AND distance >= 0 AND distance < ${Number(pParam.distance)} AND status_driver = 1 AND verified_driver = true AND type_user = '2' AND socket_id is not null`
      if (pParam.typeService === ETypeService.CAR) {
        query = query + ' AND vehicle_types.is_car = true and vehicle_types.is_moto = false'
      }
      if (pParam.typeService === ETypeService.MOTO) {
        query = query + ' AND vehicle_types.is_car = false and vehicle_types.is_moto = true'
      }
      const vResponse = await sequelize.query(query, {
        mapToModel: true,
        model: modelUser,
      }
      )
      return vResponse
    } catch (error) {
      throw error
    }
  }
  
  async show(pParam: { id: string, isDriver?: boolean }): Promise<IUserInstance | null> {
    try {
      const whereStatement: FindOptions = {}
      whereStatement.where = {
        id: pParam.id
      }
      if (pParam?.isDriver) {
        whereStatement.include = [
          {
            model: modelDriverDetail,
            as: 'detail',
            required: false
          },
          {
            model: modelUserRating,
            as: 'driverRating',
            required: false,
            attributes: ['quantity', 'ratings'],
            where: {
              type: 'driverId'
            }
          }
        ]
      } else {
        whereStatement.include = [
          {
            model: modelUserRating,
            as: 'clientRating',
            required: false,
            attributes: ['quantity', 'ratings'],
            where: {
              type: 'clientId'
            }
          },
        ]
      }

      whereStatement.attributes = ['id', 'name', 'socketId', 'tokenPush', 'avatar', 'phoneCode', 'phoneNumber', 'availabilityToTravel', 'createdAt']
      const vResponse: IUserInstance | null = await modelUser.findOne(whereStatement)
      return vResponse
    } catch (error) {
      throw error
    }
  }
  
  public async all(pParam: any): Promise<IResponseAllUser | IUserInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name', modelUser.name
      )
      
      const vResponse: IUserInstance[] = await modelUser.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllUser = await fxReponseServices(
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

  async create(pData: IUserInput): Promise<IUserInstance> {
    try {
      const vResponse: IUserInstance = await modelUser.create(pData)
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async update(pData: IUserInput): Promise<IUserInstance | null> {
    try {
      if (pData?.id) {
        const vCountry: IUserInstance | null = await modelUser.findOne({
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
      const record = await modelUser.update({ deletedAt: new Date() }, {
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
const ClassUserService = new UserService()
export default ClassUserService
