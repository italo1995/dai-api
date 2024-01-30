/* 
- File: VehicleTypeCOntroller.ts

- Purpose: Es el controlador de auth de servicios adicionales del vehiculo, se encarga de todo lo que tiene que ver con los tipos de vehiculos que en algun momento la aplicacion podria necesitar

- Author: Jairo Belen

- Creation: 29/01/2024  

==========Functions Manifest==========

- Paya Methods:
Para todo los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- show: Sirve un dato especifico filtrado por el id

2 - all: Sirve todos los datos guardados o paginado

3 - update: Cumple la funcion de recibir todos los datos que se pueden actualizarluego los envia a guardar en el servicio

4 - create: Esto es en caso de que en un futuro necesitos crear nuevos pero lo mas probable nunca se use

 */
import type { NextFunction, Request, Response } from 'express'
import ClassVehicleTypeService from '../../services/Vehicle/VehicleTypeService'
import type { IVehicleAdditionalInput, IResponseAllVehicleAdditionalType } from '../../types/VehicleTypes'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { IVehicleTypeInstance } from '../../models/Vehicle/VehicleTypeModels'

class VehicleTypeController {

  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse:IVehicleTypeInstance | null = await ClassVehicleTypeService.show(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null}, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: vResponse }, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all (pReq:Request, pRes: Response, pNext: NextFunction) {
    try{
      const vParam: any = pReq.query
      const vReponse: IResponseAllVehicleAdditionalType | IVehicleTypeInstance[] = await ClassVehicleTypeService.all(vParam)
      if (!vReponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data:vReponse }, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IVehicleAdditionalInput = pReq.only([
        'name',
      ])
      const vReponse: IVehicleTypeInstance | null = await ClassVehicleTypeService.create(vData)
      if (!vReponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: vReponse }, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IVehicleAdditionalInput = pReq.only([
        'id',
        'name',
      ])
      const vReponse: IVehicleTypeInstance | null = await ClassVehicleTypeService.update(vData)
      if (!vReponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null}, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: vReponse }, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new VehicleTypeController()