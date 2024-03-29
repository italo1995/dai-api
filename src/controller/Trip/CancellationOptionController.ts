/* 
- File: CancellationOptionController.ts

- Purpose: Es el controlador de auth de CancellationOption se encarga de la oferta monetaria de cada viaje

- Creation: 15/02/2024  

==========Functions Manifest==========

- Paya Methods:
Para todo los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- show: Sirve un dato especifico filtrado por el id

2 - all: Sirve todos los datos guardados o paginado

3 - update: Cumple la funcion de recibir todos los datos que se pueden actualizarluego los envia a guardar en el servicio

4 - create: Esto es en caso de que en un futuro necesitos crear nuevos pero lo mas probable nunca se use

 */
import type { NextFunction, Request, Response } from 'express'
import ClassCancellationOptionService from '../../services/Trip/CancellationOptionService'
import type { ICancellationOptionInput, IResponseAllCancellationOption } from '../../types/TripType'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import { type ICancellationOptionInstance } from '../../models/Trip/CancellationOptionModel'
import { ETypeUser } from '../../types/User'

class CancellationOptionController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: ICancellationOptionInstance | null = await ClassCancellationOptionService.show(vId)
      if (!vResponse) {
        return pRes
          .status(200)
          .send(fxErrorResponse(200, null, 'sin datos'))
      }
      const vReponseParse: any = { ...vResponse.dataValues }

      if (vResponse?.isDriver && vResponse?.isClient) {
        vReponseParse.rol = ETypeUser.both
      } else if (vResponse?.isClient) {
        vReponseParse.rol = ETypeUser.passenger
      }else if (vResponse?.isDriver) {
        vReponseParse.rol = ETypeUser.driver
      }
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

  async all(pReq:Request, pRes: Response, pNext: NextFunction) {
    try{
      const vParam: any = pReq.query
      const vResponse: IResponseAllCancellationOption | ICancellationOptionInstance[] = await ClassCancellationOptionService.all(vParam)
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
      const vData: ICancellationOptionInput = pReq.only([
        'name',
        'type',
        'isClient',
        'isDriver'
      ])
      const vRol = pReq.input('rol')
      if(vRol === ETypeUser.passenger || vRol === ETypeUser.both) {
        vData.isClient = true
      }
      if(vRol === ETypeUser.driver || vRol === ETypeUser.both) {
        vData.isDriver = true
      }
      const vResponse: ICancellationOptionInstance | null = await ClassCancellationOptionService.create(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) { 
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ICancellationOptionInput = pReq.only([
        'id',
        'name',
        'type',
        'isClient',
        'isDriver'
      ])
      const vRol = pReq.input('rol')
      if(vRol === ETypeUser.passenger || vRol === ETypeUser.both) {
        vData.isClient = true
      }
      if(vRol === ETypeUser.driver || vRol === ETypeUser.both) {
        vData.isDriver = true
      }
      const vResponse: ICancellationOptionInstance | null = await ClassCancellationOptionService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  }
  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = pReq.input('id')
      const vResponse: number = await ClassCancellationOptionService.destroy(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, false, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, true, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new CancellationOptionController()