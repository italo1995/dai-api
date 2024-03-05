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
  8 - showCode: Vrificar el codigo codigo enviado por el usuario es real y fue creado ese dia.
  9 - login: Se usa para el login de administrador, verificando la contraseña
*/
import type { IUserInput, IUserCodeInput, IUserInputUpdate, IUserUpdateSocket } from '../../types/User'
import { type IUserInstance } from '../../models/User/User'
import type { IUserCodeInstance } from '../../models/User/UserCode'
import { modelDriverDetail, modelUser, modelUserCode } from '../../models'
import { Op } from 'sequelize'
// import { Op } from 'sequelize'

interface IAuthService {
  showUserNumber(phoneNumber: string, phoneCode: string): Promise<IUserInstance | null>
  create(payload: IUserInput): Promise<IUserInstance>
  update(payload: IUserInputUpdate): Promise<IUserInstance | null>
  updateSocket(payload: IUserUpdateSocket): Promise<IUserInstance | null>
}

class AuthService implements IAuthService {
  async validate(data: any) {
    const dataValidate = modelUser.build(data)
    await dataValidate.validate()
  }

  async show(pId: string): Promise<IUserInstance | null> {
    try {
      const vResponse: IUserInstance | null = await modelUser.findOne({
        where: {
          id: pId,
        },
        include: {
          model: modelDriverDetail,
          as: 'detail',
          required: false
        }
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
    })
    return vResponse
  }

  async deleteUserNumber(pPhoneNumber: string): Promise<number | null> {
    const vResponse = await modelUserCode.destroy({
      where: {
        phoneNumber: pPhoneNumber,
      },
      logging: true
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
        await vUser?.update(pData, { where: { id: pData.id } })
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
      const vUpdateUserSocket = {
        id: pData.id,
        lat: pData?.lat || vUser?.dataValues?.lat || null,
        lon: pData?.lon || vUser?.dataValues?.lon || null,
        socketId: pData?.socketId || vUser?.dataValues?.socketId || null,
        statusDriver: 'statusDriver' in pData ? pData.statusDriver : vUser!.dataValues.statusDriver!
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

  async showUserCodeNumber(pPhoneNumber: string, pPhoneCode: string): Promise<string | null> {
    const vPhoneNumber: string = `${pPhoneCode}${pPhoneNumber}`
    const vDate = new Date()
    const vResponse: IUserCodeInstance | null = await modelUserCode.findOne({
      where: {
        phoneNumber: vPhoneNumber,
        createdAt: {
          [Op.gte]: vDate.toISOString().split('T')[0]
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
          [Op.gte]: vDate.toISOString().split('T')[0]
        }
      },
    })

    await vResponse?.destroy()
    if (vResponse) {
      return true
    } else {
      return false
    }
  }

  async login(pEmail: string, pPassword: string): Promise<IUserInstance | null> {
    try {
      const vUser = await modelUser.scope('withPassword').findOne({ where: { email: pEmail } })
      if (!vUser || pPassword === vUser.password) {
        return null
      }
      const vResponse: any = vUser.dataValues
      delete vResponse.password
      return vResponse
    } catch (error) {
      throw error
    }
  }
}
const ClassAuthService = new AuthService()
export default ClassAuthService
