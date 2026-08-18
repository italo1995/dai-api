/* 
- File: VehicleAdditionalCOntroller.ts

- Purpose: Es el controlador de auth de servicios adicionales del vehiculo, se encarga de todo lo que tiene que ver con los servicios adicionales que puede llevar un vehiculo, aire acondicionado, asientos de cuero, etc.

- Author: Jairo Belen

- Creation: 26/01/2024  

==========Functions Manifest==========

- Dai Methods:
Para todo los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- show: Sirve un dato especifico filtrado por el id

2 - all: Sirve todos los datos guardados o paginado

3 - update: Cumple la funcion de recibir todos los datos que se pueden actualizarluego los envia a guardar en el servicio

4 - create: Esto es en caso de que en un futuro necesitos crear nuevos pero lo mas probable nunca se use

 */
import type { NextFunction, Request, Response } from 'express'
import ClassVehicleAdditionalService from '../../services/Vehicle/VehicleAdditionalService'
import {
  type IVehicleAdditionalInput,
  type IResponseAllVehicleAdditionalType,
  EVehicleAdditionalRol,
  EVehicleAdditionalType,
} from '../../types/VehicleTypes'
import { fxSuccessResponse, fxErrorResponse, moveImages } from '../../utils/helpers'
import type { IVehicleAdditionalInstance } from '../../models/Vehicle/VehicleAdditionalModel'

class VehicleAdditionalController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: IVehicleAdditionalInstance | null =
        await ClassVehicleAdditionalService.show(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      const vReponseParse: any = { ...vResponse.dataValues }

      if (vResponse?.isRegister && vResponse?.isClient) {
        vReponseParse.rol = EVehicleAdditionalRol.AMBOS
      } else if (vResponse?.isClient) {
        vReponseParse.rol = EVehicleAdditionalRol.PASAJERO
      } else if (vResponse?.isRegister) {
        vReponseParse.rol = EVehicleAdditionalRol.CONDUCTOR
      }
      if (vResponse?.isMoto && vResponse?.isCar) {
        vReponseParse.type = EVehicleAdditionalRol.AMBOS
      } else if (vResponse?.isCar) {
        vReponseParse.type = EVehicleAdditionalType.CAR
      } else if (vResponse?.isRegister) {
        vReponseParse.type = EVehicleAdditionalType.MOTO
      }
      return pRes.status(200).send(fxSuccessResponse(200, vReponseParse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vRol = pReq.input('rol', 'number')
      if (vRol === EVehicleAdditionalRol.PASAJERO || vRol === EVehicleAdditionalRol.AMBOS) {
        vParam.isClient = true
      }
      if (vRol === EVehicleAdditionalRol.CONDUCTOR || vRol === EVehicleAdditionalRol.AMBOS) {
        vParam.isRegister = true
      }
      const vResponse: IResponseAllVehicleAdditionalType | IVehicleAdditionalInstance[] =
        await ClassVehicleAdditionalService.all(vParam)
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
        'icon',
        'isMoto',
        'isCar',
        'isClient',
        'isRegister',
      ])
      if (vData?.icon && vData?.icon.includes('temp')) {
        vData.icon = await moveImages(vData.icon)
      }
      const vRol = pReq.input('rol', 'number')
      if (vRol === EVehicleAdditionalRol.PASAJERO || vRol === EVehicleAdditionalRol.AMBOS) {
        vData.isClient = true
      } else {
        vData.isClient = false
      }
      if (vRol === EVehicleAdditionalRol.CONDUCTOR || vRol === EVehicleAdditionalRol.AMBOS) {
        vData.isRegister = true
      } else {
        vData.isRegister = false
      }
      const vType = pReq.input('type', 'number')
      if (vType === EVehicleAdditionalType.CAR || vType === EVehicleAdditionalType.AMBOS) {
        vData.isCar = true
      } else {
        vData.isCar = false
      }
      if (vType === EVehicleAdditionalType.MOTO || vType === EVehicleAdditionalType.AMBOS) {
        vData.isMoto = true
      } else {
        vData.isMoto = false
      }
      const vResponse: IVehicleAdditionalInstance | null =
        await ClassVehicleAdditionalService.create(vData)
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
      const vData: IVehicleAdditionalInput = pReq.only([
        'id',
        'name',
        'icon',
        'isMoto',
        'isCar',
        'isClient',
        'isRegister',
      ])
      const vRol = pReq.input('rol', 'number')
      const vType = pReq.input('type', 'number')
      if (vRol === EVehicleAdditionalRol.PASAJERO || vRol === EVehicleAdditionalRol.AMBOS) {
        vData.isClient = true
      } else {
        vData.isClient = false
      }
      if (vRol === EVehicleAdditionalRol.CONDUCTOR || vRol === EVehicleAdditionalRol.AMBOS) {
        vData.isRegister = true
      } else {
        vData.isRegister = false
      }
      if (vType === EVehicleAdditionalType.CAR || vType === EVehicleAdditionalType.AMBOS) {
        vData.isCar = true
      } else {
        vData.isCar = false
      }
      if (vType === EVehicleAdditionalType.MOTO || vType === EVehicleAdditionalType.AMBOS) {
        vData.isMoto = true
      } else {
        vData.isMoto = false
      }
      if (vData?.icon && vData?.icon.includes('temp')) {
        vData.icon = await moveImages(vData.icon)
      }
      const vResponse: IVehicleAdditionalInstance | null =
        await ClassVehicleAdditionalService.update(vData)
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
      const vResponse: boolean = await ClassVehicleAdditionalService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new VehicleAdditionalController()
