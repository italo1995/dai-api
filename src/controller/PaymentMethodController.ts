/* 
- File: PaymentMethodController.ts

- Purpose: Es el controlador de auth de PaymentMethod controla los posibles metodos de pago
- Author: Jairo Belen

- Creation: 06/02/2024  

==========Functions Manifest==========

- Paya Methods:
Para todo los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- show: Sirve un dato especifico filtrado por el id

2 - all: Sirve todos los datos guardados o paginado

3 - update: Cumple la funcion de recibir todos los datos que se pueden actualizarluego los envia a guardar en el servicio

4 - create: Esto es en caso de que en un futuro necesitos crear nuevos pero lo mas probable nunca se use

 */

import type { NextFunction, Request, Response } from 'express'
import { fxSuccessResponse, fxErrorResponse, moveImages } from '../utils/helpers'
import type { ITripInput, IResponseAllTrip } from '../types/PaymentMethodType'
import ClassPaymentMethodService from '../services/PaymentMethodService'
import type { IPaymentMethodInstance } from '../models/PaymentMethodModel'

class PaymentMethodController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: IPaymentMethodInstance | null = await ClassPaymentMethodService.show(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: vResponse }, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all (pReq:Request, pRes: Response, pNext: NextFunction) {
    try{
      const vParam: any = pReq.query
      const vResponse: IResponseAllTrip | IPaymentMethodInstance[] = await ClassPaymentMethodService.all(vParam)
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
      const vData: ITripInput = pReq.only([
        'name',
        'fullName',
        'dni',
        'image',
        'tax',
        'currencyId',
        'numberAccount',
        'accountType',
        'email'
      ])
      if (vData?.image && vData?.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      const vResponse: IPaymentMethodInstance | null = await ClassPaymentMethodService.create(vData)
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
      const vData: ITripInput = pReq.only([
        'id',
        'name',
        'fullName',
        'dni',
        'image',
        'tax',
        'currencyId',
        'numberAccount',
        'accountType',
        'email'
      ])
      if (vData?.image && vData?.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      const vResponse: IPaymentMethodInstance | null = await ClassPaymentMethodService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null}, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassPaymentMethodService.softDeleteRecord(vId)
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
export default new PaymentMethodController()
