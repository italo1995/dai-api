import { Op, type FindOptions, ValidationError, ValidationErrorItem } from 'sequelize'
import type { IUserInstance } from '../../models/User/User'
import sequelize, { modelDriverDetail, modelStaff, modelTrip, modelUser, modelUserRating } from '../../models'
import { EStatusTrip, ETypeService } from '../../models/Trip/TripModel'
import { fxOrderNameId, fxPaginate, fxReponseServices, fxSearchILike } from '../../utils/query'
import type { IResponseAllUser, IUserInput } from '../../types/User'

interface IUserService {
  NearbyDrivers(phoneNumber: string, phoneCode: string): Promise<IUserInstance[] | []>
  show(pParam: { id: string; isDriver?: boolean }): Promise<IUserInstance | null>
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
    const fieldsToCheck = ['email', 'phoneNumber']
    for (const field of fieldsToCheck) {
      if (data[field]) {
        const existingUser = await modelUser.findOne({
          where: { [field]: data[field] },
          logging: true,
        })
        if (existingUser) {
          const errorItems = [
            new ValidationErrorItem(
              `${field} already in use`,
              'unique violation', // type
              field, // path
              data[field], // value
              existingUser,
              'notUnique', // validatorKey
              'validate',
              []
            ),
          ]
          throw new ValidationError('Validation error', errorItems)
        }
      }
    }
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
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async show(pParam: { id: string; isDriver?: boolean, isStaff?: boolean }): Promise<IUserInstance | null> {
    try {
      const whereStatement: FindOptions = {}
      whereStatement.where = {
        id: pParam.id,
      }
      if (pParam?.isDriver) {
        whereStatement.include = [
          {
            model: modelDriverDetail,
            as: 'detail',
            required: false,
          },
          {
            model: modelUserRating,
            as: 'driverRating',
            required: false,
            attributes: ['quantity', 'ratings'],
            where: {
              type: 'driverId',
            },
          },
        ]
      } else {
        whereStatement.include = [
          {
            model: modelUserRating,
            as: 'clientRating',
            required: false,
            attributes: ['quantity', 'ratings'],
            where: {
              type: 'clientId',
            },
          },
        ]
      }
      if (pParam?.isStaff) {
        whereStatement.where = {
          ...whereStatement.where,
          staffId: {
            [Op.not]: null,
          },
        }
        whereStatement.include = [
          {
            model: modelStaff,
            as: 'staff',
          },
        ]
      }
      // whereStatement.attributes = [
      //   'id',
      //   'name',
      //   'socketId',
      //   'tokenPush',
      //   'avatar',
      //   'phoneCode',
      //   'phoneNumber',
      //   'availabilityToTravel',
      //   'createdAt',
      // ]
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
        pParam?.typeSearch || 'name',
        modelUser.name
      )
      if (pParam.type === 'user') {
        whereStatement.where = {
          ...whereStatement.where,
          rolId: 3,
        }
      } else if (pParam.type === 'driver') {
        whereStatement.where = {
          ...whereStatement.where,
          rolId: 3,
          verifiedDriver: true,
        }
        whereStatement.include = [
          {
            model: modelDriverDetail,
            as: 'detail',
            required: false,
          },
        ]
      }
      if (pParam?.isStaff) {
        whereStatement.where = {
          ...whereStatement.where,
          staffId: {
            [Op.not]: null,
          },
        }
        whereStatement.include = [
          {
            model: modelStaff,
            as: 'staff',
          },
        ]
      }
      const vResponse: IUserInstance[] = await modelUser.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllUser = await fxReponseServices(
          pParam,
          whereStatement,
          modelUser.name,
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      throw error
    }
  }

  public async location(pParam: any): Promise<IResponseAllUser | IUserInstance[]> {
    try {
      let whereStatement: FindOptions = {}
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        modelUser.name
      )
      if(pParam?.cityId) {
        whereStatement.where = {
          ...whereStatement.where,
          cityId: pParam.cityId
        }
      }
      if(pParam?.regionId) {
        whereStatement.where = {
          ...whereStatement.where,
          regionId: pParam.regionId
        }
      }
      if(pParam?.countryId) {
        whereStatement.where = {
          ...whereStatement.where,
          countryId: pParam.countryId
        }
      }
      whereStatement.where = {
        ...whereStatement.where,
        lat: {[Op.not]: null },
        lon: {[Op.not]: null },
      }
      whereStatement.include = [
        {
          model: modelDriverDetail,
          as: 'detail',
          required: false
        },
        {
          model: modelTrip,
          as: 'tripActive',
          where: {
            status: {
              [Op.or]: [EStatusTrip.ACEPTADO, EStatusTrip.PENDIENTE, EStatusTrip.INPLACE],
            }
          },
          required: false
        },
      ]
      const vResponse: IUserInstance[] = await modelUser.findAll(whereStatement)
      if (Number(pParam?.pag)) {
        const vResponsePaginate: IResponseAllUser = await fxReponseServices(
          pParam,
          whereStatement,
          modelUser.name,
          vResponse
        )
        return vResponsePaginate
      }
      return vResponse
    } catch (error) {
      console.log('error :>> ', error)
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
        const vUser: IUserInstance | null = await modelUser.findOne({
          where: {
            id: pData.id,
          },
        })
        await vUser?.update(pData)
        return vUser
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async updateLocation(pData: { id: string, cityId?: number | null, regionId?: number | null, countryId?: number | null }): Promise<IUserInstance | null> {
    try {
      if (pData?.id) {
        const vUser: IUserInstance | null = await modelUser.findOne({
          where: {
            id: pData.id,
          },
        })
        await vUser?.update(pData)
        return vUser
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async sumBalance(pData: { id: string, balance: number }): Promise<IUserInstance | null> {
    try {
      if (pData?.id && pData.balance) {
        const vUser: IUserInstance | null = await modelUser.findOne({
          where: {
            id: pData.id,
          },
        })
        const balance = Number(vUser?.dataValues.balance) || 0
        await vUser?.update({
          balance: Number(balance) + pData.balance,
        })
        return vUser
      }
      return null
    } catch (error) {
      throw error
    }
  }
  async softDeleteRecord(pId: number) {
    try {
      const record = await modelUser.update(
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
const ClassUserService = new UserService()
export default ClassUserService
