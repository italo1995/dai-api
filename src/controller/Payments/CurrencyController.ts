/* 
- File: CurrencyController.ts

- Purpose: Es el controlador de auth de Currency, se encarga de la multimoneda
- Author: Jairo Belen

- Creation: 06/02/2024  

==========Functions Manifest==========

- Paya Methods:
Para todo los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- show: Sirve un dato especifico filtrado por el id

2 - all: Sirve todos los datos guardados o paginado

3 - update: Cumple la funcion de recibir todos los datos que se pueden actualizar luego los envia a guardar en el servicio

4 - create: Esto es en caso de que en un futuro necesitos crear nuevos pero lo mas probable nunca se use

 */
import type { NextFunction, Request, Response } from 'express'
import ClassCurrencyService from '../../services/Payments/CurrencyService'
import type { ICurrencyInput, IResponseAllCurrency } from '../../types/CurrencyType'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { ICurrencyInstance } from '../../models/payments/CurrencyModel'

class CurrencyController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: ICurrencyInstance | null = await ClassCurrencyService.show(vId)
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

  async all (pReq:Request, pRes: Response, pNext: NextFunction) {
    try{
      const vParam: any = pReq.query
      const vResponse: IResponseAllCurrency | ICurrencyInstance[] = await ClassCurrencyService.all(vParam)
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
      const vData: ICurrencyInput = pReq.only([
        'name',
        'symbol',
        'change',
        'type',
        'auto',
        'icon'
      ])
      const vResponse: ICurrencyInstance | null = await ClassCurrencyService.create(vData)
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
      const vData: ICurrencyInput = pReq.only([
        'id',
        'name',
        'symbol',
        'change',
        'type',
        'auto',
        'icon'
      ])
      const vResponse: ICurrencyInstance | null = await ClassCurrencyService.update(vData)
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

  async updateMany(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData = pReq.input('data', 'json')
      const vUpdateData: ICurrencyInput[] = []
      for (const item of vData) {
        if (item.id) {
          vUpdateData.push({
            id: item.id,
            name: item.name,
            symbol: item.symbol,
            change: item.change,
            type: item.type,
            auto: item.auto,
            icon: item.icon,
          })
        }
      }
      const vResponse: ICurrencyInstance[] | null = await ClassCurrencyService.updateMany(vUpdateData)
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
      const vId: number = pReq.input('id', 'number')
      const vResponse: boolean = await ClassCurrencyService.softDeleteRecord(vId)
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



export default new CurrencyController()