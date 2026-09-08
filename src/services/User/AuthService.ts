/* 
- File: AuthService.ts

- Purpose: El serivicio auth se encarga de las consultas con los modelos y funcionalidades relacionadas al auth

- Author: Italo Belen

- Creation: 17/01/2024  

==========Functions Manifest==========

- AuthService Methods:
  1 - validate: valida los campos con respecto al modelo, para estar seguro de que son los formatos permitidos y caso contrario devuelve un error de validacion
  2 - show: trae los datos del usuario segun el id, puede usarse en el perfil o para verificar informacion del usuario
  3 - showUserNumber: Verifica si existe un usuario con ese numero de telefono y codigo de area
  4 - showUserCodeNumber: Sirve para verificar si el usuario ya tiene un codigo creado ese dia.
  5 - create: crea datos del usuario
  6 - update: actualiza datos del usuario
  7 - createCode: Guarda los codigos generados en la base de datos
  8 - showCode: Verifica que el codigo enviado por el usuario es real y fue creado ese dia.
  9 - login: Se usa para el login de administrador, verificando la contraseña
*/
import { Op, Sequelize, ValidationError, ValidationErrorItem } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'
import type {
  IUserInput,
  IUserCodeInput,
  IUserInputUpdate,
  IUserUpdateSocket,
} from '../../types/User'
import { ETypeUser } from '../../types/User'
import { EStatusDriver, type IUserInstance } from '../../models/User/UserModel'
import type { IUserCodeInstance } from '../../models/User/UserCodeModel'
import { modelDriverDetail, modelUser, modelUserCode, modelUserRating, modelVehicleType } from '../../models'

interface IAuthService {
  showUserNumber(phoneNumber: string, phoneCode: string): Promise<IUserInstance | null>
  create(payload: IUserInput): Promise<IUserInstance>
  update(payload: IUserInputUpdate): Promise<IUserInstance | null>
  updateSocket(payload: IUserUpdateSocket): Promise<IUserInstance | null>
  disconnect(pId: string): Promise<boolean | IUserInstance>
  delete(pId: string): Promise<boolean>
  beginDriverSession(pUserId: string): Promise<string | null | undefined>
  clearSocketIfCurrent(pUserId: string, pExpectedSocketId: string): Promise<void>
}

class AuthService implements IAuthService {
  async validate(data: any) {
    const fieldsToCheck = ['email', 'phoneNumber']
    for (const field of fieldsToCheck) {
      if (data[field] === null || data[field] === undefined) {
        const errorItems = [
          new ValidationErrorItem(
            `${field} is required`,
            'notnull violation', // type
            field, // path
            data[field], // value
            modelUser.build(data),
            'is_null', // validatorKey
            'validate',
            []
          ),
        ]
        throw new ValidationError('Validation error', errorItems)
      }
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
    const dataValidate = modelUser.build(data)
    await dataValidate.validate()
  }

  async show(pId: string): Promise<IUserInstance | null> {
    try {
      const vResponse: IUserInstance | null = await modelUser.scope(['allAttributes', 'isDriverSuspended']).findOne({
        where: {
          id: pId,
        },
        attributes: {
          include: [
            [Sequelize.literal('(SELECT COUNT(*) from trips as m where "m"."driver_id"="User"."id")'), 'countTrip'],
          ]
        },
        include: [
          {
            model: modelDriverDetail,
            as: 'detail',
            required: false,
          },
          {
            model: modelUserRating,
            as: 'clientRating',
            required: false,
            attributes: ['quantity', 'ratings'],
            where: {
              type: 'clientId',
            },
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
        ],
      })
      return vResponse
    } catch (error) {
      throw error
    }
  }

  async approve(pId: string): Promise<IUserInstance | null> {
    try {
      if (pId) {
        const vUser: IUserInstance | null = await modelUser.findOne({
          where: {
            id: pId,
          },
        })
        await vUser?.update({ verifiedDriver: true })
        return vUser
      }
      return null
    } catch (error) {
      throw error
    }
  }

  async showUserNumber(pPhoneNumber: string, pPhoneCode: string): Promise<IUserInstance | null> {
    const vResponse = await modelUser.findOne({
      where: {
        phoneNumber: pPhoneNumber,
        phoneCode: pPhoneCode,
      },
      include: [
        {
          model: modelUserRating,
          as: 'clientRating',
          required: false,
          attributes: ['quantity', 'ratings'],
          where: {
            type: 'clientId',
          },
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
      ],
      paranoid: false,
    })
    return vResponse
  }

  async deleteUserNumber(pPhoneNumber: string): Promise<number | null> {
    const vResponse = await modelUserCode.destroy({
      where: {
        phoneNumber: pPhoneNumber,
      },
    })
    return vResponse
  }

  async create(pData: IUserInput): Promise<IUserInstance> {
    const vResponse: IUserInstance = await modelUser.create(pData)
    return vResponse
  }

  async update(pData: IUserInputUpdate): Promise<IUserInstance | null> {
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

  async updateSocket(pData: IUserUpdateSocket): Promise<IUserInstance | null> {
    if (pData?.id) {
      const vUser: IUserInstance | null = await modelUser.findOne({
        where: {
          id: pData.id,
        },
      })
      const balance = Number(vUser?.dataValues.balance) || 0
      const vUpdateUserSocket = {
        id: pData.id,
        lat: pData?.lat || vUser?.dataValues?.lat || null,
        lon: pData?.lon || vUser?.dataValues?.lon || null,
        // 'socketId' in pData (no solo su valor) porque el disconnect manda socketId:null a
        // proposito para limpiarlo - con || caia en el fallback y el null nunca se guardaba,
        // dejando el socketId viejo/muerto en la DB para siempre despues de cada desconexion.
        socketId: 'socketId' in pData ? pData.socketId : vUser?.dataValues?.socketId || null,
        statusDriver:
          'statusDriver' in pData ? pData.statusDriver : vUser!.dataValues.statusDriver!,
        balance: pData?.discount ? Number(balance) - pData.discount : balance,
      }
      await vUser?.update(vUpdateUserSocket)
      return vUser
    }
    return null
  }

  async createCode(pData: IUserCodeInput): Promise<IUserCodeInstance> {
    const vResponse: IUserCodeInstance = await modelUserCode.create(pData)
    return vResponse
  }

  async deleteSocketCode(socketId: string) {
    await modelUser?.update(
      {
        tokenPush: null,
        socketId: null,
      },
      { where: { socketId: socketId } }
    )
  }

  async showUserCodeNumber(pPhoneNumber: string, pPhoneCode: string): Promise<string | null> {
    const vPhoneNumber: string = `${pPhoneCode}${pPhoneNumber}`
    const vDate = new Date()
    const vResponse: IUserCodeInstance | null = await modelUserCode.findOne({
      where: {
        phoneNumber: vPhoneNumber,
        createdAt: {
          [Op.gte]: this.formatearFecha(vDate),
        },
      },
    })
    return vResponse?.dataValues?.code || null
  }

  async showCode(pData: IUserCodeInput): Promise<boolean> {
    const vDate = new Date()
    const vResponse: IUserCodeInstance | null = await modelUserCode.findOne({
      where: {
        code: pData.code,
        phoneNumber: pData.phoneNumber,
        createdAt: {
          [Op.gte]: this.formatearFecha(vDate),
        },
      },
    })

    await vResponse?.destroy()
    if (vResponse) {
      return true
    } else {
      return false
    }
  }

  async login(pEmail: string): Promise<IUserInstance | null> {
    try {
      const vUser: any = await modelUser.scope('withPassword').findOne({ where: { email: pEmail } })
      return vUser
      // if (!vUser || !bcrypt.compareSync(pPassword, vUser.password)) {
      //   throw new Error('Email or password is incorrect')
      // } else {
      //   const userResponse = JSON.parse(JSON.stringify(vUser))
      //   delete userResponse.password
      //   return vUser
      // }
    } catch (error) {
      throw error
    }
  }

  async disconnect(pId: string): Promise<false | IUserInstance> {
    try {
      const vUser: IUserInstance | null = await modelUser.findOne({
        where: {
          id: pId,
        },
      })
      if (vUser) {
        await vUser?.update(
          {
            tokenPush: null,
            socketId: null,
            statusDriver: EStatusDriver.INACTIVE,
            // Libera el "cupo" de sesion activa (ver QA-03/beginDriverSession) - un logout
            // explicito es la unica forma normal de que otro dispositivo pueda entrar despues
            // con la misma cuenta.
            activeSessionId: null,
          },
          { where: { id: pId } }
        )
        return vUser
      }
      return false
    } catch (error) {
      throw error
    }
  }

  async delete(pId: string): Promise<boolean> {
    try {
      const record = await modelUser.update(
        {
          tokenPush: null,
          socketId: null,
          phoneNumber: pId,
          avatar: null,
          email: null,
          name: null,
          statusDriver: EStatusDriver.INACTIVE,
          deletedAt: new Date(),
        },
        {
          where: { id: pId },
        }
      )
      if (!record) {
        return false
      }
      return true
      // const vUser: IUserInstance | null = await modelUser.findOne({
      //   where: {
      //     id: pId,
      //   },
      // })
      // console.log('vUser :>> ',           {
      //   tokenPush: null,
      //   socketId: null,
      //   phoneNumber: pId,
      //   avatar: null,
      //   email: null,
      //   name: null,
      //   statusDriver: EStatusDriver.INACTIVE,
      //   deletedAt: new Date(),
      // })
      // if (vUser) {
      //   await vUser?.update(
      // {
      //   tokenPush: null,
      //   socketId: null,
      //   phoneNumber: pId,
      //   avatar: null,
      //   email: null,
      //   name: null,
      //   statusDriver: EStatusDriver.INACTIVE,
      //   deletedAt: new Date(),
      // }
      //   )
      //   console.log('vUser :>> ', JSON.stringify(vUser))
      //   return true
      // }
      // return false
    } catch (error) {
      throw error
    }
  }

  // QA-03: al hacer login/verifiedUserCode, si el usuario es conductor y ya tiene una sesion
  // activa (otro dispositivo logueado sin haber hecho logout), rechaza el intento devolviendo
  // null en vez de generar una sesion nueva - "gana el primero". Para cualquier otro typeUser
  // (pasajero, staff, admin, tienda) no aplica ningun limite: devuelve undefined y el JWT se
  // genera sin sessionId, como siempre. Busca el usuario de nuevo con el scope por defecto (no
  // usa el que le pasen) porque el caller (login) trae al usuario con el scope 'withPassword',
  // que no incluye typeUser ni activeSessionId.
  async beginDriverSession(pUserId: string): Promise<string | null | undefined> {
    const vUser: IUserInstance | null = await modelUser.findOne({ where: { id: pUserId } })
    if (vUser?.dataValues.typeUser !== ETypeUser.driver) {
      return undefined
    }
    if (vUser?.dataValues.activeSessionId) {
      return null
    }
    const vSessionId = uuidv4()
    await vUser?.update({ activeSessionId: vSessionId })
    return vSessionId
  }

  // Carrera del disconnect (ver analisis de Ricardo, 2026-09-08): si el socket A muere sin que
  // el server se entere de inmediato (ping timeout ~45s), el cliente puede reconectar como
  // socket B mientras tanto - la DB ya quedo con B. Cuando por fin llega el disconnect tardio
  // de A, si limpiara el socketId sin condicion, pisaria el B bueno con null y el usuario queda
  // conectado pero inalcanzable en silencio hasta reiniciar la app. Por eso esto es un UPDATE
  // atomico condicionado (compare-and-swap): solo limpia si el socketId en la DB sigue siendo
  // exactamente el que se esta desconectando - si ya cambio (alguien reconecto), no toca nada.
  async clearSocketIfCurrent(pUserId: string, pExpectedSocketId: string): Promise<void> {
    await modelUser.update(
      { socketId: null },
      { where: { id: pUserId, socketId: pExpectedSocketId } }
    )
  }

  private formatearFecha(date: Date) {
    const dia = date.getDate().toString().padStart(2, '0')
    const mes = (date.getMonth() + 1).toString().padStart(2, '0')
    const año = date.getFullYear()
    return `${año}-${mes}-${dia}`
  }
}
const ClassAuthService = new AuthService()
export default ClassAuthService
