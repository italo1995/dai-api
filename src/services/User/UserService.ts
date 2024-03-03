import { type FindOptions } from 'sequelize'
import type { IUserInstance } from '../../models/User/User'
import sequelize, { modelDriverDetail, modelUser } from '../../models'
import { ETypeService } from '../../models/Trip/TripModel'

interface IUserService {
  NearbyDrivers(phoneNumber: string, phoneCode: string): Promise<IUserInstance[] | []>
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
      let query = `SELECT * FROM (SELECT id, lat, lon, socket_id, status_driver, verified_driver, type_user, token_push, availability_to_travel, vehicle_type, (6371 * acos(cos(radians(${Number(pParam.lat)})) * cos(radians(lat)) * cos(radians(lon) - radians(${Number(pParam.lon)})) + sin(radians(${Number(pParam.lat)})) * sin(radians(lat)))) as distance FROM users) as temp left join vehicle_types on temp.vehicle_type = vehicle_types.id WHERE NOT distance IS NULL AND distance >= 0 AND distance < ${Number(pParam.distance)} AND status_driver = 1 AND verified_driver = true AND type_user = '2' AND socket_id is not null`
      if (pParam.typeService === ETypeService.CAR) {
        console.log('debo filtrar por carro')
        query = query + ' AND vehicle_types.is_car = true and vehicle_types.is_moto = false'
      }
      if (pParam.typeService === ETypeService.MOTO) {
        query = query + ' AND vehicle_types.is_car = false and vehicle_types.is_moto = true'
      }
      console.log('query NearbyDrivers :>> ', query)
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
            required: true
          }
        ]
      }

      whereStatement.attributes = ['id', 'name', 'socketId', 'tokenPush', 'avatar', 'phoneCode', 'phoneNumber', 'availabilityToTravel', 'createdAt']
      const vResponse: IUserInstance | null = await modelUser.findOne(whereStatement)
      return vResponse
    } catch (error) {
      throw error
    }
  }
}
const ClassUserService = new UserService()
export default ClassUserService
