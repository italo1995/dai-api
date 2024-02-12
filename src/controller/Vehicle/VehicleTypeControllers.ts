/* 
- File: VehicleTypeController.ts

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
import { fxSuccessResponse, fxErrorResponse, moveImages } from '../../utils/helpers'
import type { IVehicleTypeInstance } from '../../models/Vehicle/VehicleTypeModels'
import { modelVehicleType } from '../../models'

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
      const vResponse: IResponseAllVehicleAdditionalType | IVehicleTypeInstance[] = await ClassVehicleTypeService.all(vParam)
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
      const vData: IVehicleAdditionalInput = pReq.only([
        'name',
        'is_moto',
        'is_car'
      ])
      if (vData?.icon && vData?.icon.includes('temp')) {
        vData.icon = await moveImages(vData.icon)
      }
      const vResponse: IVehicleTypeInstance | null = await ClassVehicleTypeService.create(vData)
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

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IVehicleAdditionalInput = pReq.only([
        'id',
        'name',
        'is_moto',
        'is_car'
      ])
      if (vData?.icon && vData?.icon.includes('temp')) {
        vData.icon = await moveImages(vData.icon)
      }
      const vResponse: IVehicleTypeInstance | null = await ClassVehicleTypeService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null}, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: vResponse }, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  }
  async softDeleteRecord(pId: number) {
    try {
      const record = await modelVehicleType.update({ deletedAt: new Date() }, {
        where: { id: pId }
      })
      if (!record) {
        return false
      }
      return true
    } catch (error) {
      throw error
    }
  }
}

export default new VehicleTypeController()