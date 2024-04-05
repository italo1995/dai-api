/* 
- File: BankController.ts

- Purpose: Es el controlador de auth de bank, se encarga de los bancos
- Author: Jairo Belen

- Creation: 26/03/2024  

==========Functions Manifest==========

- Paya Methods:
Para todos los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- show: Sirve un dato especifico filtrado por el id

2 - all: Sirve todos los datos guardados o paginado

3 - update: Cumple la funcion de recibir todos los datos que se pueden actualizar luego los envia a guardar en el servicio

4 - create: Esto es en caso de que en un futuro necesitos crear nuevos pero lo mas probable nunca se use

 */
import type { NextFunction, Request, Response } from 'express'
import ClassBankService from '../../services/Payments/BankService'
import type { IResponseAllBank, IBankInput } from '../../types/PaymentMethodType'
import { fxSuccessResponse, fxErrorResponse, moveImages } from '../../utils/helpers'
import type { IBankInstance } from '../../models/payments/BankModel'

class BankController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: IBankInstance | null = await ClassBankService.show(vId)
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
      const vParam: any = pReq.query
      // vParam.accountType = pReq.query.accountType ? Number(pReq.query.accountType) : undefined
      const vResponse: IResponseAllBank | IBankInstance[] = await ClassBankService.all(vParam)
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
      const vData: IBankInput = pReq.only([
        'name',
        'icon',
        'phoneNumber',
        'accountNumber',
        'currencyId',
        'fullName',
        'dni',
        'accountType',
        'email',
        'hasCapture',
      ])
      if (vData?.icon && vData?.icon.includes('temp')) {
        vData.icon = await moveImages(vData.icon)
      }
      const vResponse: IBankInstance | null = await ClassBankService.create(vData)
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
      const vData: IBankInput = pReq.only([
        'id',
        'name',
        'icon',
        'phoneNumber',
        'accountNumber',
        'currencyId',
        'fullName',
        'dni',
        'accountType',
        'email',
        'hasCapture'
      ])
      if (vData?.icon && vData?.icon.includes('temp')) {
        vData.icon = await moveImages(vData.icon)
      }
      const vResponse: IBankInstance | null = await ClassBankService.update(vData)
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
      const vResponse: boolean = await ClassBankService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new BankController()
