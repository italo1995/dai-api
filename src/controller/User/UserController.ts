/* 
- File: UserController.ts

- Purpose: Es el controlador de User se encarga de los comentarios de los usuarios
- Author: Jairo Belen

- Creation: 17/03/2024  
 */
import type { NextFunction, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import ClassUser from '../../services/User/UserService'
import { type IUserInput, type IResponseAllUser, ETypeUser } from '../../types/User'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { IUserInstance } from '../../models/User/UserModel'
import ClassVerifyService from '../../services/User/VerifyService'
import { EStatusVerify } from '../../models/User/VerifyModel'
import TripService from '../../services/Trip/TripService'
import NotificationService from '../fcmPushController'
import { PushMessages } from '../../constants/pushMessages'
import { STORE_ROL_ID } from '../../services/User/PasswordResetService'

class UserController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = pReq.input('id', 'string')
      const vIsDriver: boolean = pReq.input('isDriver', 'json') ?? false
      const vResponse: IUserInstance | null = await ClassUser.show({
        id: vId,
        isDriver: vIsDriver || false,
      })
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      const vReponseUser = {
        ...vResponse.dataValues,
        count: await TripService.countTrip(vResponse.dataValues.id, vResponse.dataValues.typeUser),
      }
      return pRes.status(200).send(fxSuccessResponse(200, vReponseUser, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAllUser | IUserInstance[] = await ClassUser.all(vParam)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async operatorAll(_pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vResponse: IResponseAllUser | IUserInstance[] = await ClassUser.operatorAll()
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async location(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAllUser | IUserInstance[] = await ClassUser.location(vParam)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      // let vResponseJSON = []
      // if ('data' in vResponse) {
      //   vResponseJSON = JSON.parse(JSON.stringify(vResponse.data))
      // } else {
      //   vResponseJSON = JSON.parse(JSON.stringify(vResponse))
      // }
      // for (const user of vResponseJSON) {
      //   if (!user.driverRating) {
      //     user.driverRating = {
      //       quantity: 0,
      //       ratings: 5,
      //     }
      //   }
      // }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      console.log('error :>> ', error)
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IUserInput = pReq.only([
        'name',
        'email',
        'phoneCode',
        'phoneNumber',
        'rolId',
        'status',
        'statusDriver',
        'verifiedDriver',
        'typeUser',
        'password',
      ])
      // Opcional: solo lo usan flujos como "crear dueño de tienda" desde el admin, donde el
      // usuario necesita poder loguearse despues. Si no viene, el usuario queda sin clave
      // (mismo comportamiento de antes) hasta que se registre/actualice por otro medio.
      if (typeof vData.password === 'string' && vData.password) {
        vData.password = bcrypt.hashSync(vData.password, 10)
      }
      await ClassUser.validate(vData)
      const vResponse: IUserInstance | null = await ClassUser.create(vData)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }

      if (vData.typeUser === '2') {
        const verifyData = {
          userId: vResponse.id,
          status: EStatusVerify.verifying,
        }
        await ClassVerifyService.create(verifyData)
      }

      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IUserInput = pReq.only([
        'id',
        'name',
        'lastName',
        'email',
        'rolId',
        'status',
        'statusDriver',
        'verifiedDriver',
        'typeUser',
        'daiFood',
        'daiMarket',
      ])
      // Correo y telefono desde Admin > Usuarios tienda (Italo, 2026-10-29). El telefono solo se
      // edita aca para cuentas de tienda (rolId 4), que entran con correo y contraseña: el de
      // clientes y conductores es su login por SMS, cambiarlo desde el panel les quitaria el acceso.
      const vHasPhone = pReq.body?.phoneCode !== undefined || pReq.body?.phoneNumber !== undefined
      if (vData?.id && (vHasPhone || vData.email !== undefined)) {
        const vTarget: IUserInstance | null = await ClassUser.show({ id: String(vData.id) })
        if (!vTarget) {
          return pRes.status(404).send(fxErrorResponse(404, null, 'Usuario no encontrado'))
        }
        const vIsStore = Number(vTarget.dataValues.rolId) === STORE_ROL_ID
        if (vHasPhone) {
          if (!vIsStore) {
            return pRes.status(400).send(fxErrorResponse(400, null, 'El teléfono de clientes y conductores no se puede cambiar desde el panel: es su acceso por SMS'))
          }
          // El codigo se acepta con "+" adelante (hay filas viejas guardadas asi) pero se guarda
          // solo con digitos, como la mayoria.
          const vPhoneCode = String(pReq.body.phoneCode ?? '').replace(/\s/g, '').replace(/^\+/, '')
          const vPhoneNumber = String(pReq.body.phoneNumber ?? '').replace(/\s/g, '')
          if (!vPhoneCode && !vPhoneNumber) {
            vData.phoneCode = null as any
            vData.phoneNumber = null as any
          } else if (!/^\d{1,4}$/.test(vPhoneCode) || !/^\d{6,15}$/.test(vPhoneNumber)) {
            return pRes.status(400).send(fxErrorResponse(400, null, 'El teléfono no es válido: usa solo dígitos en el código (máximo 4) y en el número (6 a 15)'))
          } else {
            if (await ClassUser.isFieldTaken('phoneNumber', vPhoneNumber, vTarget.dataValues.id)) {
              return pRes.status(409).send(fxErrorResponse(409, null, 'Ese número ya está registrado en otra cuenta'))
            }
            vData.phoneCode = vPhoneCode
            vData.phoneNumber = vPhoneNumber
          }
        }
        if (vData.email !== undefined) {
          const vEmail = String(vData.email ?? '').trim()
          if (!vEmail) {
            if (vIsStore) {
              return pRes.status(400).send(fxErrorResponse(400, null, 'El correo es obligatorio: la tienda lo usa para iniciar sesión'))
            }
          } else {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(vEmail)) {
              return pRes.status(400).send(fxErrorResponse(400, null, 'El correo no es válido'))
            }
            if (await ClassUser.isFieldTaken('email', vEmail, vTarget.dataValues.id)) {
              return pRes.status(409).send(fxErrorResponse(409, null, 'Ese correo ya está registrado en otra cuenta'))
            }
            vData.email = vEmail
          }
        }
      }
      if (vData.typeUser === ETypeUser.driver && vData?.id) {
        const vUserDB: IUserInstance | null = await ClassUser.show({
          id: vData.id,
          isDriver: true,
        })
        if (vData.verifiedDriver && !vUserDB?.dataValues?.verifiedDriver && vUserDB?.dataValues?.tokenPush) {
          await NotificationService.sendNotification(
            [vUserDB.dataValues.tokenPush],
            PushMessages.usuarioActivado()
          )
        }
      }
      const vResponse: IUserInstance | null = await ClassUser.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error: any) {
      // Respaldo si otra cuenta tomo el mismo correo/numero entre la verificacion y el update.
      if (error?.name === 'SequelizeUniqueConstraintError') {
        const vField = error?.errors?.[0]?.path
        const vMessage = vField === 'phone_number' || vField === 'phoneNumber'
          ? 'Ese número ya está registrado en otra cuenta'
          : 'Ese correo ya está registrado en otra cuenta'
        return pRes.status(409).send(fxErrorResponse(409, null, vMessage))
      }
      // El modelo tiene su propia regex de email, mas estricta que la de arriba.
      if (error?.name === 'SequelizeValidationError' && error?.errors?.[0]?.path === 'email') {
        return pRes.status(400).send(fxErrorResponse(400, null, 'El correo no es válido'))
      }
      pNext(error)
    }
  }

  async suspended(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IUserInput = pReq.only([
        'id',
        'status',
      ])
      const vResponse: IUserInstance | null = await ClassUser.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
      console.log('error :>> ', error)
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'string')
      const vResponse: boolean = await ClassUser.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }

  // Lista usuarios borrados, para el panel de "Usuarios eliminados" (ver restore() abajo).
  async allDeleted(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAllUser | IUserInstance[] = await ClassUser.allDeleted(vParam)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  // Restaura un usuario borrado (deletedAt = null) - reactiva la cuenta tal cual estaba.
  async restore(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = pReq.input('id', 'string')
      const vResponse: boolean = await ClassUser.restore(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Restaurado con exito'))
    } catch (error) {
      pNext(error)
    }
  }

  // Libera el numero de telefono y el correo de un usuario borrado SIN reactivar la cuenta -
  // para cuando el admin borro a alguien a proposito y no quiere que la cuenta vuelva, pero
  // esos datos deberian poder usarse en un registro nuevo. Ver el comentario de
  // ClassUser.releaseContactInfo.
  async releaseContactInfo(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = pReq.input('id', 'string')
      const vResponse: boolean = await ClassUser.releaseContactInfo(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Datos liberados con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new UserController()
