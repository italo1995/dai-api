import { Op, type FindOptions, ValidationError, ValidationErrorItem, Sequelize } from 'sequelize'
import type { IUserInstance } from '../../models/User/UserModel'
import sequelize, { modelDriverDetail, modelStaff, modelSuspension, modelTrip, modelUser, modelUserRating, modelVehicleType, modelVerify } from '../../models'
import { EStatusTrip, ETypeService } from '../../models/Trip/TripModel'
import { fxOrderNameId, fxPaginate, fxReponseServices, fxSearchILike } from '../../utils/query'
import type { IResponseAllUser, IUserInput } from '../../types/User'
import { EStatusVerify } from '../../models/User/VerifyModel'
import CompanyParameterService from '../web/CompanyParameterService'
import CurrencyService from '../Payments/CurrencyService'
import { SocketService } from '../../ws'

interface IUserService {
  NearbyDrivers(phoneNumber: string, phoneCode: string): Promise<IUserInstance[] | []>
  show(pParam: { id: string; isDriver?: boolean }): Promise<IUserInstance | null>
  all(pParam: any): Promise<IResponseAllUser | IUserInstance[]>
  operatorAll(): Promise<IUserInstance[]>
  allUserAdmin(): Promise<IUserInstance[]>
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
      const vPercentageParameter = await CompanyParameterService.showByName('percentage')
      const vPercentage: number = Number(vPercentageParameter?.dataValues?.value) || 10
      const commission: number = pParam?.minAmount ? (pParam.minAmount * vPercentage) / 100 : 0
      let minAmount = 0
      if (pParam.currencyId && commission) {
        minAmount = await CurrencyService.convert({ currencyId: Number(pParam.currencyId), amount: Number(commission) })
      }
      let query = `SELECT temp.*, vehicle_types.is_car, vehicle_types.is_moto FROM (SELECT id, lat, lon, socket_id, status_driver, verified_driver, type_user, token_push, availability_to_travel, vehicle_type, balance, driver_suspended_to, (6371 * acos(cos(radians(${Number(pParam.lat)})) * cos(radians(lat)) * cos(radians(lon) - radians(${Number(pParam.lon)})) + sin(radians(${Number(pParam.lat)})) * sin(radians(lat)))) as distance FROM users where balance > ${minAmount}) as temp left join vehicle_types on temp.vehicle_type = vehicle_types.id WHERE NOT distance IS NULL AND distance >= 0 AND distance < ${Number(pParam.distance)} AND status_driver = 1 AND verified_driver = true AND type_user = '2' AND socket_id is not null`
      if (pParam.typeService === ETypeService.CAR) {
        query = query + ' AND vehicle_types.is_car = true and vehicle_types.is_moto = false'
      }
      if (pParam.typeService === ETypeService.MOTO) {
        query = query + ' AND vehicle_types.is_car = false and vehicle_types.is_moto = true'
      }
      console.log('query :>> ', query)
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
          {
            model: modelVerify,
            as: 'verify',
            required: false,
            where: {
              status: EStatusVerify.denied
            }
          },
          {
            model: modelVehicleType,
            as: 'vehicleTypeData',
            required: false,
            attributes: ['name', 'isMoto', 'isCar']
          },
          {
            model: modelSuspension,
            as: 'suspension',
            required: false,
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

      const vResponse: IUserInstance | null = await modelUser.scope(['allAttributes', 'isDriverSuspended']).findOne(whereStatement)
      return vResponse
    } catch (error) {
      console.log('error :>> ', error)
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
        if ('status' in pParam && pParam.status !== null) {
          whereStatement.where = {
            ...whereStatement.where,
            status: pParam.status,
          }
        }
      } else if (pParam.type === 'driver') {
        whereStatement.where = {
          ...whereStatement.where,
          rolId: 3,
        }
        whereStatement.include = [
          {
            model: modelDriverDetail,
            as: 'detail',
            required: true,
          },
          {
            model: modelVerify,
            as: 'verify',
            required: false,
            where: {
              status: EStatusVerify.denied
            }
          },
        ]
        if ('verifiedDriver' in pParam && pParam.verifiedDriver !== null) {
          const vDate = new Date()
          whereStatement.where = {
            ...whereStatement.where,
            verifiedDriver: pParam.verifiedDriver,
            driverSuspendedTo: {
              [Op.or]: {
                [Op.lt]: `${vDate.toISOString().split('T')[0]} 00:00:00.000 +00:00`,
                [Op.is]: null
              }
            },
          }
        }
        if ('status' in pParam && pParam.status !== null) {
          if (Number(pParam.status) === 3) {
            whereStatement.include = [
              ...whereStatement.include,
              {
                model: modelVerify,
                as: 'verify',
                required: true,
                where: {
                  status: EStatusVerify.denied
                }
              },
            ]
          } else {
            whereStatement.where = {
              ...whereStatement.where,
              status: pParam.status,
            }
          }
        }
        if ('suspended' in pParam && pParam.suspended !== null) {
          const vDate = new Date()
          if (Number(pParam.suspended) === 1 || pParam.suspended) {
            whereStatement.where = {
              ...whereStatement.where,
              driverSuspendedTo: {
                [Op.gt]:  `${vDate.toISOString().split('T')[0]} 00:00:00.000 +00:00`
              },
            }
          } else {
            whereStatement.where = {
              ...whereStatement.where,
              driverSuspendedTo: {
                [Op.lt]:  `${vDate.toISOString().split('T')[0]} 00:00:00.000 +00:00`
              },
            }
          }
        }
        if (!pParam?.orden) {
          whereStatement.order = [
            ...whereStatement.order,
            ['verifiedDriver', 'asc']
          ]
        }
      } else if (pParam.type === 'store') {
        // Usuarios con rol 'store' (rolId=4), para que el admin pueda elegir un dueño ya
        // existente al crear una tienda en vez de tener que pegar el uuid a mano.
        whereStatement.where = {
          ...whereStatement.where,
          rolId: 4,
        }
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
      if (pParam?.phoneNumber) {
        whereStatement.where = {
          ...whereStatement.where,
          phoneNumber: {
            [Op.iLike]: `%${pParam?.phoneNumber}%`
          }
        }
      }
      if (pParam?.code) {
        whereStatement.where = {
          ...whereStatement.where,
          phoneNumber: {
            [Op.iLike]: `%${pParam?.code}%`
          }
        }
      }
      const vResponse: IUserInstance[] = await modelUser.scope(['allAttributes', 'isDriverSuspended']).findAll(whereStatement)
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

  public async operatorAll(): Promise<IUserInstance[]> {
    try {
      const vResponse: IUserInstance[] = await modelUser.findAll({
        attributes: ['id', 'name'],
        where: {
          staffId: {
            [Op.not]: null
          }
        }
      })
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
      whereStatement.attributes = {
        include: [
          [Sequelize.literal('(SELECT COUNT(*) from trips as m where "m"."driver_id"="User"."id")'), 'countTrip'],
        ]
      }
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
      // const vDate = new Date()
      whereStatement.where = {
        ...whereStatement.where,
        lat: {[Op.not]: null },
        lon: {[Op.not]: null },
        verifiedDriver: true,
        // socketId: {[Op.not]: null },
        // driverSuspendedTo: {
        //   [Op.or]: {
        //     [Op.lt]: `${vDate.toISOString().split('T')[0]} 00:00:00.000 +00:00`,
        //     [Op.is]: null
        //   }
        // },
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
        {
          model: modelUserRating,
          as: 'driverRating',
          required: false,
          attributes: ['quantity', 'ratings'],
          where: {
            type: 'driverId',
          },
        },
        {
          model: modelVehicleType,
          as: 'vehicleTypeData',
          required: false,
          attributes: ['name', 'isMoto', 'isCar'],
        }
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

  async updateLocation(pData: { id: string, cityId?: number | null, regionId?: number | null, countryId?: number | null, lat?: number | null, lon?: number | null }): Promise<IUserInstance | null> {
    try {
      if (pData?.id) {
        const vUser: IUserInstance | null = await modelUser.findOne({
          where: {
            id: pData.id,
          },
        })
        const vDataUser = {
          cityId: pData?.cityId || Number(vUser?.dataValues?.cityId) || null,
          regionId: pData?.regionId || Number(vUser?.dataValues?.regionId) || null,
          countryId: pData?.countryId || Number(vUser?.dataValues?.countryId) || null,
          lat: pData?.lat || vUser?.dataValues?.lat || null,
          lon: pData?.lon || vUser?.dataValues?.lon || null,
        }
        await vUser?.update(vDataUser)
        return vUser
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async sumBalance(pData: { id: string, balance?: number, discount?: number }): Promise<IUserInstance | null> {
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
        SocketService.io.to(vUser?.dataValues.socketId).emit('recharge', {
          balance: vUser?.balance,
          type: 'recharge'
        })
        return vUser
      }
      
      if (pData?.id && pData.discount) {
        const vUser: IUserInstance | null = await modelUser.findOne({
          where: {
            id: pData.id,
          },
        })
        const balance = Number(vUser?.dataValues.balance) || 0
        await vUser?.update({
          balance: pData?.discount ? Number(balance) - pData.discount : balance,
        })
        SocketService.io.to(vUser?.dataValues.socketId).emit('recharge', {
          balance: vUser?.balance,
          type: 'withDraw'
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

  public async allUserAdmin(): Promise<IUserInstance[]> {
    try {
      const whereStatement: FindOptions = {
        attributes: ['id', 'rolId', 'socketId'],
        where: {
          rolId: {
            [Op.or]: [1, 2]
          },
          socketId: {
            [Op.not]: null
          }
        }
      }
      const vResponse: IUserInstance[] = await modelUser.scope(['allAttributes', 'isDriverSuspended']).findAll(whereStatement)
      return vResponse
    } catch (error) {
      throw error
    }
  }
}
const ClassUserService = new UserService()
export default ClassUserService
