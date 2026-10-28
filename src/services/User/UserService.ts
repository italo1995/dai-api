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
import ClassUserDeviceService from './UserDeviceService'

// Un "destinatario" admin/operator a avisar - ya no es necesariamente una fila de "users" (puede
// ser una entrada sintetica por cada dispositivo adicional de user_devices, ver allUserAdmin).
export interface IAdminNotifyTarget {
  id: string
  rolId: number
  socketId: string | null
  tokenPush: string | null
}

interface IUserService {
  NearbyDrivers(phoneNumber: string, phoneCode: string): Promise<IUserInstance[] | []>
  show(pParam: { id: string; isDriver?: boolean }): Promise<IUserInstance | null>
  all(pParam: any): Promise<IResponseAllUser | IUserInstance[]>
  operatorAll(): Promise<IUserInstance[]>
  allUserAdmin(): Promise<IAdminNotifyTarget[]>
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
        minAmount = await CurrencyService.convertToPrincipal({ currencyId: Number(pParam.currencyId), amount: Number(commission) })
      }
      // Diagnostico QA #10 (monedas != dolar) - probo bien 2026-09-17, se deja instalado por si
      // reaparece en produccion.
      console.log('[QA-10-DEBUG] NearbyDrivers input :>>', {
        currencyId: pParam.currencyId,
        rawMinAmount: pParam?.minAmount,
        percentage: vPercentage,
        commission,
        minAmountConverted: minAmount,
        typeService: pParam.typeService,
      })
      let query = `SELECT temp.*, vehicle_types.is_car, vehicle_types.is_moto FROM (SELECT id, lat, lon, socket_id, status_driver, verified_driver, type_user, token_push, availability_to_travel, vehicle_type, balance, driver_suspended_to, dai_food, dai_market, (6371 * acos(cos(radians(${Number(pParam.lat)})) * cos(radians(lat)) * cos(radians(lon) - radians(${Number(pParam.lon)})) + sin(radians(${Number(pParam.lat)})) * sin(radians(lat)))) as distance FROM users where balance > ${minAmount}) as temp left join vehicle_types on temp.vehicle_type = vehicle_types.id WHERE NOT distance IS NULL AND distance >= 0 AND distance < ${Number(pParam.distance)} AND status_driver = 1 AND verified_driver = true AND type_user = '2' AND socket_id is not null`
      if (pParam.typeService === ETypeService.CAR) {
        query = query + ' AND vehicle_types.is_car = true and vehicle_types.is_moto = false'
      }
      if (pParam.typeService === ETypeService.MOTO) {
        query = query + ' AND vehicle_types.is_car = false and vehicle_types.is_moto = true'
      }
      // Marketplace ([Orden 5/8]): no filtra por tipo de vehiculo (un repartidor puede ser moto
      // o carro), filtra por la habilitacion dai_food / dai_market segun el type de la tienda.
      // pParam.storeType llega como 'food' | 'market' (ETypeStore).
      if (pParam.typeService === ETypeService.MARKETPLACE) {
        if (pParam.storeType === 'market') {
          query = query + ' AND temp.dai_market = true'
        } else {
          query = query + ' AND temp.dai_food = true'
        }
      }
      console.log('query :>> ', query)
      const vResponse = await sequelize.query(query, {
        mapToModel: true,
        model: modelUser,
      })
      // Diagnostico QA #10: cuantos conductores matchearon - si esto da 0, el problema esta ACA
      // (query/balance/vehiculo), no en como el cliente arma o muestra el viaje.
      console.log('[QA-10-DEBUG] NearbyDrivers encontrados :>>', vResponse.length)
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

  // Lista usuarios borrados (paranoid:false + filtro deletedAt IS NOT NULL) para que el admin
  // pueda encontrar uno y restaurarlo, en vez de tener que editar la base de datos a mano. Un
  // numero de telefono queda inutilizable mientras el usuario borrado siga asi (phoneNumber
  // sigue siendo unique:true a proposito) - restaurar la cuenta original es la forma de
  // recuperarlo. Ver tambien restore().
  public async allDeleted(pParam: any): Promise<IResponseAllUser | IUserInstance[]> {
    try {
      let whereStatement: FindOptions = { paranoid: false }
      whereStatement = fxPaginate(pParam, whereStatement)
      whereStatement.order = fxOrderNameId(pParam, whereStatement)
      whereStatement.where = fxSearchILike(
        pParam,
        whereStatement,
        pParam?.typeSearch || 'name',
        modelUser.name
      )
      whereStatement.where = {
        ...whereStatement.where,
        deletedAt: { [Op.ne]: null },
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

  // Restaura un usuario soft-deleted (deletedAt = null) - vuelve la cuenta a estar activa tal
  // cual estaba. paranoid:false es necesario en el where para que Sequelize encuentre la fila -
  // por default excluye las borradas.
  async restore(pId: string): Promise<boolean> {
    try {
      const [vAffected] = await modelUser.update(
        { deletedAt: null },
        { where: { id: pId }, paranoid: false }
      )
      return vAffected > 0
    } catch (error) {
      throw error
    }
  }

  // Libera el numero de telefono Y el correo de un usuario borrado SIN reactivar la cuenta -
  // para cuando un admin borro a alguien a proposito (ej: mal comportamiento) y no quiere que
  // vuelva, pero esos datos deberian poder usarse en un registro nuevo de otra persona (ambos
  // campos son unique:true, a proposito no se toca eso - ver User.email/phoneNumber). A
  // diferencia de restore(), esto deja deletedAt intacto (el usuario sigue bloqueado/oculto) y
  // solo limpia phoneNumber/email (ambos nullable) - el resto de los datos de la cuenta borrada
  // se conservan para historial/auditoria. Se valida primero que el usuario siga borrado, para
  // no liberar por error los datos de una cuenta activa.
  async releaseContactInfo(pId: string): Promise<boolean> {
    try {
      const vExisting = await modelUser.findOne({ where: { id: pId }, paranoid: false })
      if (!vExisting || !vExisting.dataValues.deletedAt) {
        return false
      }
      const [vAffected] = await modelUser.update(
        // phoneNumber/email estan tipados sin '| null' porque en el resto del codebase siempre
        // se asumen presentes - se acota el cast solo a esta escritura puntual en vez de aflojar
        // el tipo global y arriesgar romper esos otros usos.
        { phoneNumber: null, email: null } as any,
        { where: { id: pId }, paranoid: false }
      )
      return vAffected > 0
    } catch (error) {
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
        if (vUser?.dataValues.socketId) {
          SocketService.io.to(vUser.dataValues.socketId).emit('recharge', {
            balance: vUser?.balance,
            type: 'recharge'
          })
        } else {
          console.log('sumBalance: usuario sin socket activo, no se pudo avisar en vivo', { id: pData.id })
        }
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
        if (vUser?.dataValues.socketId) {
          SocketService.io.to(vUser.dataValues.socketId).emit('recharge', {
            balance: vUser?.balance,
            type: 'withDraw'
          })
        } else {
          console.log('sumBalance: usuario sin socket activo, no se pudo avisar en vivo', { id: pData.id })
        }
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

  // Devuelve un "destinatario" por cada socketId/tokenPush vigente de cada admin/operator -
  // multi-dispositivo (Italo, 2026-09-21): antes exigia socketId no nulo en la propia fila de
  // "users" (dejaba afuera a cualquier admin sin un socket conectado en ESE momento, aunque
  // tuviera token de push - un admin usando solo la app en background nunca recibia nada) y solo
  // devolvia un socketId/tokenPush por admin (el ultimo dispositivo que lo piso). Ahora junta el
  // valor viejo de la fila con todo lo que haya en user_devices y arma una entrada por cada
  // socketId y cada tokenPush distintos - los llamadores existentes (que solo hacen
  // `.map(x => x.tokenPush)` / `.map(x => x.socketId)`) siguen funcionando igual, sin cambios,
  // simplemente ahora la lista puede traer mas de una entrada por admin.
  public async allUserAdmin(): Promise<IAdminNotifyTarget[]> {
    try {
      const vAdmins = await modelUser.findAll({
        attributes: ['id', 'rolId', 'socketId', 'tokenPush'],
        where: { rolId: { [Op.or]: [1, 2] } },
      })
      if (!vAdmins.length) return []
      const vAdminIds = vAdmins.map((pAdmin) => pAdmin.dataValues.id)
      const vDevices = await ClassUserDeviceService.allForUsers(vAdminIds)
      const vTargets: IAdminNotifyTarget[] = []
      for (const vAdmin of vAdmins) {
        const vId = vAdmin.dataValues.id
        const vOwnDevices = vDevices.filter((pDevice) => pDevice.userId === vId)
        const vSocketIds = new Set<string>(
          [vAdmin.dataValues.socketId, ...vOwnDevices.map((pDevice) => pDevice.socketId)].filter(Boolean) as string[]
        )
        const vTokenPushes = new Set<string>(
          [vAdmin.dataValues.tokenPush, ...vOwnDevices.map((pDevice) => pDevice.tokenPush)].filter(Boolean) as string[]
        )
        const vRolId = Number(vAdmin.dataValues.rolId)
        for (const vSocketId of vSocketIds) {
          vTargets.push({ id: vId, rolId: vRolId, socketId: vSocketId, tokenPush: null })
        }
        for (const vTokenPush of vTokenPushes) {
          vTargets.push({ id: vId, rolId: vRolId, socketId: null, tokenPush: vTokenPush })
        }
      }
      return vTargets
    } catch (error) {
      throw error
    }
  }
}
const ClassUserService = new UserService()
export default ClassUserService
