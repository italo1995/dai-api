/* 
- File: AuthController.ts

- Purpose: Es el controlador de auth de usuarios, se encarga de todo lo que tiene que ver con login y registro, incluyendo la parte de mensajes y verificacion del mismo

- Author: Italo Belen

- Creation: 17/01/2024  

==========Functions Manifest==========

- Paya Methods:
Para todo los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- registerOrCreateUserForNumber: Este metodo se encarga de verificar el numero telefonico, si existe ya un usuario y si ya tiene un codigo creado para el dia de hoy.
  - En caso de no tener un codigo creado y no estar registrado crea un nuevo codigo y lo envia usando sms. Luego crea un usuario usando solo el numero de telefono y el codigo de area.
  - En caso de tener ser un usario ya existente y no tener un codigo, se genera un codigo y se envia.
  - En caso de tener ser un usario ya existente y un codigo, se verifica la fecha, si es de "hoy", se envia el mismo dia se envia el mismo, en caso de no serlo se genera uno nuevo y se envia.
  - Reponde con el usuario

2 - verifiedUserCode: Recibe el codigo, el numero telefonico y el codigo de area
  - Verifica que los datos coincidan y sean del dia de hoy
  - Reponde con los datos del usuario y el jwt | responde con un error diciendo que el codigo es incorrecto

3 - update: Cumple la funcion de recibir todos los datos que el usuario puede actualizar en la creacion del mismo y luego los envia a guardar en el servicio

3 - register: Cumple la funcion registrar un usuario sin numero (se usara luego para la parte administrativa) Aun no esta testeada y falta desarrollo. Se hara en el momento de su uso

3 - register: Cumple la funcion loguear un usuario sin numero (se usara luego para la parte administrativa) Aun no esta testeada y falta desarrollo. Se hara en el momento de su uso

 */
import type { NextFunction, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import ClassAuthService from '../../services/User/AuthService'
import {
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
import type { IUserInstance } from '../../models/User/User'
import ClassDriverDetailService from '../../services/User/DriverDetailService'
import ClassUserService from '../../services/User/UserService'
import NotificationService from '../fcmPushController'
import TripService from '../../services/Trip/TripService'

class AuthController {
  async registerOrCreateUserForNumber(
    pReq: Request,
    pRes: Response,
    pNext: NextFunction
  ): Promise<Response | undefined> {
    try {
      const vData: IUserInput = pReq.only(['phoneCode', 'phoneNumber'])
      const vHash: string = pReq.input('hash')
      const vUpdatePhoneNumber: boolean = pReq.input('updatePhoneNumber', 'json')
      vData.phoneNumber = vData?.phoneNumber.toString()
      vData.isNewUser = true
      const vPhoneNumberExist: IUserInstance | null = await ClassAuthService.showUserNumber(
        vData.phoneNumber,
        vData.phoneCode
      )
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
              if (element.type === 'image') {
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
        'roleId',
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
      const vData = pReq.only(['email', 'password'])
      vData.password = await bcrypt.hash(vData.password, 10)
      const user = await ClassAuthService.login(vData.email, vData.password)
      if (user) {
        const vToken = fxGenerateAccessToken(user)
        return pRes
          .status(200)
          .send(fxSuccessResponse(200, { token: vToken, user }, 'logueado con exito'))
      }
      return pRes.status(400).send(fxErrorResponse(400, null, 'Email or password is incorrect'))
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
      const vResponse = {
        ...vUserDB.dataValues,
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
      const vUserDB: boolean = await ClassAuthService.disconnect(vUserId)
      if (!vUserDB) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
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
