import { type FindOptions } from 'sequelize'
import type { IUserInstance } from '../../models/User/User'
import sequelize, { modelDriverDetail, modelTrip, modelUser } from '../../models'

interface IUserService {
  NearbyDrivers(phoneNumber: string, phoneCode: string): Promise<IUserInstance[] | []>
}

class UserService implements IUserService {
  async validate(data: any) {
    const dataValidate = modelUser.build(data)
    await dataValidate.validate()
  }
  public async NearbyDrivers(pParam: any): Promise<IUserInstance[] | []> {
    try {
      const query = `SELECT * FROM (SELECT id, lat, lon, socket_id, (6371 * acos(cos(radians(${pParam.lat})) * cos(radians(lat)) * cos(radians(lon) - radians(${pParam.lon})) + sin(radians(${pParam.lat})) * sin(radians(lat)))) as distance FROM users) as temp WHERE NOT distance IS NULL AND distance > 0 AND distance < ${pParam.distance}`
      console.log('query :>> ', query)
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
  
  async show(pParam: any): Promise<IUserInstance | null> {
    const whereStatement: FindOptions = {}
    if (pParam?.isDriver) {
      whereStatement.where = {
        id: pParam.id
      }
      whereStatement.include = [
        {
          model: modelDriverDetail,
          as: 'detail',
          required: true
        }
      ]
    } else {
      whereStatement.include = [
        {
          model: modelTrip,
          as: 'trip',
          required: true,
          where: {
            id: pParam.tripId
          }
        }
      ]
    }
    whereStatement.attributes = ['name', 'socketId', 'avatar', 'createdAt']
    const vResponse: IUserInstance | null = await modelUser.findOne(whereStatement)
    return vResponse
  }
}
const ClassUserService = new UserService()
export default ClassUserService
