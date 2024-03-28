/* 
- File: CountryController.ts

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
import ClassCountryService from '../../services/Locations/CountryService'
import type { ICountryInput, ICountryUpdate } from '../../types/LocationType'
import { fxSuccessResponse, fxErrorResponse, } from '../../utils/helpers'
import type { ICountryInstance } from '../../models/Locations/Country'
import type { IResponseAll } from '../../types/generalType'

class CountryController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: ICountryInstance | null = await ClassCountryService.show(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const param = pReq.query

      const vResponse: IResponseAll | ICountryInstance[] = await ClassCountryService.all(param)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ICountryInput = pReq.only([
        'name',
        'flags',
        'phoneCode',
        'state',
        'phone'
      ])

      const vResponse: ICountryInstance | null = await ClassCountryService.create(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ICountryUpdate = pReq.only([
        'id',
        'name',
        'flag',
        'phoneCode',
        'state',
        'phone'
      ])
      const vResponse: ICountryInstance | null = await ClassCountryService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassCountryService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new CountryController()
