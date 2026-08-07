/*
- File: AuthController.ts

- Purpose: Es el controlador de auth de usuarios, se encarga de todo lo que tiene que ver con login y registro, incluyendo la parte de mensajes y verificacion del mismo

- Author: Italo Belen

- Creation: 17/01/2024

==========Functions Manifest==========

- Paya Methods:
Para todos los casos, si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.

1 - registerOrCreateUserForNumber (POST /api/auth/phone, publico): flujo de login/registro por numero de telefono, usado por la app movil.
  - Verifica el numero telefonico: si no existe un usuario con ese numero, crea uno nuevo (solo con phoneCode/phoneNumber). Si ya existe, lo reutiliza.
  - Genera (o reutiliza el del dia) un codigo de verificacion y lo envia por SMS via Twilio.
  - Si updatePhoneNumber es true, en vez de crear un usuario actualiza el telefono del usuario autenticado (requiere Bearer token).
  - Reponde con el usuario.

2 - verifiedUserCode (POST /api/auth/verifiedUserCode, publico): recibe el codigo, el numero telefonico y el codigo de area.
  - Verifica que el codigo coincida y sea del dia de hoy.
  - Reponde con los datos del usuario y el jwt, o con un error si el codigo es incorrecto/vencido.

3 - update (POST /api/auth/update, requiere Bearer): actualiza los datos del usuario autenticado (perfil, tipo de usuario, detalle de conductor).
  - Si se envia phoneNumber/phoneCode, exige tambien el code (verificado antes via verifiedUserCode) para aceptar el cambio.
  - Si se envia details, crea/actualiza el detalle de conductor asociado.
  - Notifica por push/socket a los administradores cuando un conductor nuevo se registra o edita su informacion.

4 - register (POST /api/auth/register, publico): registra un usuario con email y contraseña (uso administrativo, sin numero de telefono).
  - email y phoneNumber son obligatorios y unicos; el rol siempre queda el de por defecto (no se puede elegir desde aqui).
  - Reponde con el usuario y el jwt.

5 - login (POST /api/auth/login, publico): loguea un usuario existente con email y contraseña (staff/administrativo).
  - Reponde con el usuario (incluyendo sus vistas si es operador) y el jwt, o un error si el email/password no coinciden.

6 - me (GET /api/auth/me, requiere Bearer): devuelve los datos del usuario autenticado, incluyendo su conteo de viajes.

7 - NearbyDrivers: busca conductores cercanos por lat/lon/distance. Nota: la ruta esta comentada en AuthRoute.ts, este metodo no esta expuesto actualmente.

8 - approve (POST /api/admin/approve, requiere Bearer operador/admin, enrutado en AdminRoute.ts): marca a un conductor como verificado y le notifica por push/whatsapp.

9 - disconnect (POST /api/auth/disconnect, requiere Bearer): desconecta al usuario autenticado (limpia socketId/tokenPush) y avisa por socket a los administradores si era un conductor.

10 - delete (POST /api/auth/delete, requiere Bearer): elimina (soft delete) la cuenta del usuario autenticado, anonimizando sus datos personales.

 */
import type { NextFunction, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import ClassAuthService from '../../services/User/AuthService'
import {
  ETypeUser,
  type IDriverDetailInput,
  type IUserCodeInput,
  type IUserInput,
  type IUserInputUpdate,
} from '../../types/User'
import {
  fxSuccessResponse,
  fxErrorResponse,
  fxGenerateAccessToken,
  fxTwilioSendCode,
  moveImages,
  fxSendMessage,
} from '../../utils/helpers'
import type { IUserInstance } from '../../models/User/UserModel'
import ClassDriverDetailService from '../../services/User/DriverDetailService'
import ClassUserService from '../../services/User/UserService'
import NotificationService from '../fcmPushController'
import TripService from '../../services/Trip/TripService'
import StaffViewService from '../../services/web/StaffViewService'
import { SocketService } from '../../ws'

class AuthController {
  async registerOrCreateUserForNumber(
    pReq: Request,
    pRes: Response,
    pNext: NextFunction
  ): Promise<Response | undefined> {
    try {
      const vData: IUserInput = pReq.only(['phoneCode', 'phoneNumber'])
      console.log('vData :>> ', vData)
      const vHash: string = pReq.input('hash')
      const vUpdatePhoneNumber: boolean = pReq.input('updatePhoneNumber', 'json')
      vData.phoneNumber = vData?.phoneNumber.toString()
      const vPhoneNumberExist: IUserInstance | null = await ClassAuthService.showUserNumber(
        vData.phoneNumber,
        vData.phoneCode
      )
      if (vPhoneNumberExist?.dataValues?.deletedAt && vPhoneNumberExist?.dataValues?.deletedAt !== null) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Usuario bloqueado'))
      }
      if (vUpdatePhoneNumber && vPhoneNumberExist) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'El numero ya existe'))
      }
      const vCodePhoneNumberExist: string | null = await ClassAuthService.showUserCodeNumber(
        vData.phoneNumber,
        vData.phoneCode
      )

      const vPhoneNumberSend: string = `${vData.phoneCode}${vData.phoneNumber}`
      const vCode: string | null = await fxTwilioSendCode(
        vPhoneNumberSend,
        vCodePhoneNumberExist || null,
        vHash
      )

      let vUser: IUserInstance
      if (vUpdatePhoneNumber) {
        vUser = pReq.auth
        if (!vUser) {
          return pRes.status(500).send(fxErrorResponse(500, null, 'Error en usuario'))
        }
      } else if (!vPhoneNumberExist) {
        vData.balance = 0
        vData.isNewUser = true
        vUser = await ClassAuthService.create(vData)
      } else {
        vUser = vPhoneNumberExist
      }
      const vCreateCode: IUserCodeInput = {
        code: vCode,
        userId: vUser?.dataValues?.id || vUser?.id,
        phoneNumber: `${vData.phoneCode}${vData.phoneNumber}`,
      }
      await ClassAuthService.createCode(vCreateCode)
      const vResponse: any = fxSuccessResponse(200, { user: vUser }, 'Usuario registrado con exito')
      return pRes.status(200).send(vResponse)
    } catch (error) {
      console.log('error :>> ', error)
      pNext(error)
    }
  }

  async verifiedUserCode(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vCode: string = pReq.input('code')
      const vphoneCode: string = pReq.input('phoneCode').toString()
      const vphoneNumber: string = pReq.input('phoneNumber').toString()
      const socketId: string | null = pReq.input('socketId')
        ? pReq.input('socketId').toString()
        : null
      const vPhoneNumber: string = `${vphoneCode}${vphoneNumber}`
      const vVerifiedCode: boolean = await ClassAuthService.showCode({
        code: vCode.trim(),
        phoneNumber: vPhoneNumber,
      })
      if (vVerifiedCode) {
        const vUser: IUserInstance | null = await ClassAuthService.showUserNumber(
          vphoneNumber,
          vphoneCode
        )
        if (!vUser) {
          return pRes.status(500).send(fxErrorResponse(500, { code: false }, 'Codigo incorrecto'))
        }
        if (socketId) {
          await ClassAuthService.updateSocket({
            id: vUser.id,
            socketId: socketId,
          })
        }
        const vResponse = {
          user: JSON.parse(JSON.stringify(vUser)),
          token: fxGenerateAccessToken(vUser.dataValues),
        }
        await ClassAuthService.deleteUserNumber(vPhoneNumber)
        return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
      } else {
        return pRes.status(500).send(fxErrorResponse(500, { code: false }, 'Codigo incorrecto'))
      }
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vUserId: string = pReq.auth.id
      if (vUserId) {
        const vData: IUserInputUpdate = pReq.only([
          'avatar',
          'name',
          'lastName',
          'email',
          'vehicleType',
          'dob',
          'isTaxi',
          'isVip',
          'isAc',
          'availabilityToTravel',
          'typeUser',
          'seats',
          'tokenPush',
          'phoneNumber',
          'phoneCode',
        ])
        const vPhoneNumber: string = pReq.input('phoneNumber')
        const vPhoneCode: string = pReq.input('phoneCode')
        const vCode = pReq.input('code')
        if (vPhoneNumber && vCode) {
          const vPhoneNumberCode: string = `${vPhoneCode}${vPhoneNumber}`
          const vVerifiedCode: boolean = await ClassAuthService.showCode({
            code: vCode.trim(),
            phoneNumber: vPhoneNumberCode,
          })
          if (vVerifiedCode) {
            vData.phoneNumber = vPhoneNumber
            vData.phoneCode = vPhoneCode
          } else {
            return pRes.status(500).send(fxErrorResponse(500, { code: false }, 'Codigo incorrecto'))
          }
        }
        const vBeforeUserDB: IUserInstance | null = await ClassAuthService.show(vUserId)
        vData.isNewUser = false // Esto es para saber que el usuario completo el registro!
        vData.id = vUserId
        const vDetail: any = pReq.input('details', 'json')
        if (vData?.avatar) {
          const vRouteAvatarImages = await moveImages(vData.avatar)
          vData.avatar = vRouteAvatarImages
        }
        if (vDetail) {
          const driverDetail: IDriverDetailInput[] = []
          for (const detail of vDetail) {
            for (const field of detail.fields) {
              const element: IDriverDetailInput = {
                sectionName: detail.sectionName,
                fieldName: field.fieldName,
                type: field.type,
                userId: vUserId,
                value: '',
              }
              if (field.fieldName === 'vehicleType') {
                vData.vehicleType = Number(field.value)
              }
              if (
                field.fieldName === 'travelAvailability' ||
                field.fieldName === 'availabilityToTravel'
              ) {
                vData.availabilityToTravel = field?.value
              }
              if (element.type === 'image' && field?.value && field.value !== '0' && field.value !== 'null') {
                const vRouteAvatarImages = await moveImages(field.value)
                element.value = vRouteAvatarImages
              } else {
                element.value = field.value
              }
              driverDetail.push(element)
            }
          }
          ClassDriverDetailService.createMany(driverDetail, vUserId)
        }
        if (vData?.typeUser !== pReq.auth.typeUser) {
          const tripActive = await TripService.showActive({
            userId: vUserId,
            isClient: true,
          })
          if (tripActive) {
            return pRes
              .status(500)
              .send(
                fxErrorResponse(
                  500,
                  null,
                  'No puede cambiar el tipo de usuario mientras tiene una orden activa'
                )
              )
          }
        }
        const vUserDB: IUserInstance | null = await ClassAuthService.update(vData)
        if (!vUserDB) {
          return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
        }
        if (vBeforeUserDB?.dataValues?.isNewUser) {
          const admin = await ClassUserService.allUserAdmin()
          const socketIds: any[] = admin.map((vUser: any) => vUser.socketId)
          const pushIds: any[] = admin.map((vUser: any) => vUser.tokenPush)
          if (vData?.typeUser === ETypeUser.driver) {
            if (pushIds.length) {
              const notificationData = {
                title: 'Hay un nuevo candidato para conductor.',
                body: ' Por favor recuerda verificarlo. ¡Eso es PaYá!.',
              }
              await NotificationService.sendNotification(
                pushIds,
                notificationData
              )
            }
          }
          SocketService.io.to(socketIds).emit('newDriver', vUserDB)
        } else {
          const admin = await ClassUserService.allUserAdmin()
          const pushIds: any[] = admin.map((vUser: any) => vUser.tokenPush)
          if (vData?.typeUser === ETypeUser.driver) {
            if (pushIds.length) {
              const notificationData = {
                title: `${vUserDB.dataValues.name} editó su información`,
                body: 'Por favor recuerda verificarlo. ¡Eso es PaYá!.',
              }
              await NotificationService.sendNotification(
                pushIds,
                notificationData
              )
            }
          }
        }
        const vReponseUser = {
          ...vUserDB.dataValues,
          count: await TripService.countTrip(vUserDB.id, vUserDB.typeUser),
        }
        return pRes
          .status(200)
          .send(fxSuccessResponse(200, { user: vReponseUser }, 'Codigo verificado'))
      } else {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
    } catch (error) {
      pNext(error)
    }
  }

  async register(
    pReq: Request,
    pRes: Response,
    pNext: NextFunction
  ): Promise<Response | undefined> {
    try {
      // Recogemos los datos que nos interesan para el regositro
      const vData: IUserInput = pReq.only([
        'email',
        'password',
        'phoneCode',
        'phoneNumber',
        'name',
        'avatar',
      ])
      //verificamos si el numero existe

      vData.status = true
      vData.isNewUser = true
      //validamos que esten completos
      await ClassAuthService.validate(vData)
      //registramos el usuario usando el servicio
      if (typeof vData.password === 'string') {
        vData.password = bcrypt.hashSync(vData.password, 10)
      }
      const vUser: IUserInstance = await ClassAuthService.create(vData)
      //respondemos
      const vToken = fxGenerateAccessToken(vUser)
      const vUserData = {
        token: vToken,
        user: vUser,
      }
      return pRes.status(200).send(fxSuccessResponse(200, vUserData, 'Registrado'))
    } catch (error: any) {
      pNext(error)
    }
  }

  async login(pReq: Request, pRes: Response, pNext: NextFunction): Promise<Response | undefined> {
    try {
      const vData = pReq.only(['email', 'password', 'socketId'])
      const vUser = await ClassAuthService.login(vData.email)
      if (!vUser || !bcrypt.compareSync(vData.password, vUser.password)) {
        return pRes.status(400).send(fxErrorResponse(400, null, 'Email or password is incorrect'))
      } else {
        await ClassAuthService.updateSocket({
          ...vData,
          id: vUser.id
        })
        const userResponse = JSON.parse(JSON.stringify(vUser))
        if (Number(userResponse.rolId) === 2 && userResponse.staffId) {
          const view = await StaffViewService.all({
            staffId: userResponse.staffId
          })
          userResponse.views = JSON.parse(JSON.stringify(view))
        }
        delete userResponse.password
        const vToken = fxGenerateAccessToken(vUser)
        return pRes
          .status(200)
          .send(fxSuccessResponse(200, { token: vToken, user: userResponse }, 'logueado con exito'))
      }
    } catch (error) {
      pNext(error)
    }
  }

  async me(pReq: Request, pRes: Response, pNext: NextFunction): Promise<Response | undefined> {
    try {
      const vUserId: string = pReq.auth.id
      const vUserDB: IUserInstance | null = await ClassAuthService.show(vUserId)
      if (!vUserDB) {
        return pRes.status(500).send(fxErrorResponse(500, { user: null }, 'Ocurrio un error'))
      }
      const userResponse = JSON.parse(JSON.stringify(vUserDB))
      if (Number(userResponse.rolId) === 2 && userResponse.staffId) {
        const view = await StaffViewService.all({
          staffId: userResponse.staffId
        })
        userResponse.views = JSON.parse(JSON.stringify(view))
      }
      const vResponse = {
        ...userResponse,
        count: await TripService.countTrip(vUserDB.id, vUserDB.typeUser),
      }
      return pRes.status(200).send(fxSuccessResponse(200, { user: vResponse }))
    } catch (error: any) {
      pNext(error)
    }
  }

  async NearbyDrivers(
    pReq: Request,
    pRes: Response,
    pNext: NextFunction
  ): Promise<Response | undefined> {
    try {
      const vParam = pReq.only(['lat', 'lon', 'distance'])
      const vUserDB: IUserInstance[] | [] = await ClassUserService.NearbyDrivers(vParam)
      if (!vUserDB) {
        return pRes.status(500).send(fxErrorResponse(500, { user: null }, 'Ocurrio un error'))
      }
      const vResponse = {
        user: vUserDB,
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse))
    } catch (error: any) {
      pNext(error)
    }
  }

  async approve(pReq: Request, pRes: Response, pNext: NextFunction): Promise<Response | undefined> {
    try {
      const vUserId: string = pReq.input('userId')
      const vUserDB: IUserInstance | null = await ClassAuthService.approve(vUserId)
      if (!vUserDB) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (vUserDB?.tokenPush) {
        const notificationData = {
          title: 'Usuario verificado',
          body: 'tu usuario ha sido verificado',
          data: JSON.stringify({
            verifiedDriver: true,
          }),
        }
        await NotificationService.sendNotification([vUserDB?.tokenPush], notificationData)
        await fxSendMessage(vUserDB)
      }
      const vResponse = {
        user: vUserDB,
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse))
    } catch (error: any) {
      pNext(error)
    }
  }

  async disconnect(
    pReq: Request,
    pRes: Response,
    pNext: NextFunction
  ): Promise<Response | undefined> {
    try {
      const vUserId: string = pReq.auth.id
      const vUserDB: boolean | IUserInstance = await ClassAuthService.disconnect(vUserId)
      if (!vUserDB) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (vUserDB.dataValues.typeUser === ETypeUser.driver) {
        const vUserDisconnect = await ClassAuthService.show(vUserDB.dataValues.id)
        const admin = await ClassUserService.allUserAdmin()
        const socketIds: any[] = admin.map((vUser: any) => vUser.socketId)
        SocketService.io.to(socketIds).emit('userDisconnect', vUserDisconnect)
        console.log('Se emite userDisconnect')
      }
      return pRes.status(200).send(fxSuccessResponse(200, true))
    } catch (error: any) {
      pNext(error)
    }
  }

  async delete(pReq: Request, pRes: Response, pNext: NextFunction): Promise<Response | undefined> {
    try {
      const vUserId: string = pReq.auth.id
      const vUserDB: boolean = await ClassAuthService.delete(vUserId)
      if (!vUserDB) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, true))
    } catch (error: any) {
      pNext(error)
    }
  }
}

export default new AuthController()
