/* 
- File: CarDataController.ts

- Purpose: Es el controlador de CarData se encarga de las caracteristicas de los vehiculos
- Author: Jairo Belen

- Creation: 16/03/2024  
 */
import type { NextFunction, Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import ClassCarDataService from '../../services/Vehicle/CarDataService'
import type { ICarDataInput, IResponseAllCarData } from '../../types/VehicleTypes'
import { fxSuccessResponse, fxErrorResponse, moveImages } from '../../utils/helpers'
import type { ICarDataAttributes, ICarDataInstance } from '../../models//Vehicle/CarDataModel'
import VehicleTypeService from '../../services/Vehicle/VehicleTypeService'
import type { IVehicleTypeInstance } from '../../models/Vehicle/VehicleTypeModel'

class CarDataController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: ICarDataInstance | null = await ClassCarDataService.show(vId)
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
      if (vParam.vehicleId) {
        const vVehicleType: IVehicleTypeInstance | null = await VehicleTypeService.show(
          vParam.vehicleId
        )
        if (vVehicleType) {
          vParam.isCar = vVehicleType.dataValues.isCar
          vParam.isMoto = vVehicleType.dataValues.isMoto
        }
      }
      vParam.orden = 2
      const vResponse: IResponseAllCarData | ICarDataInstance[] =
        await ClassCarDataService.all(vParam)
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

  async getModelsByBrand(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const brandId = pReq.params.brandId
      const models = await ClassCarDataService.getModelsByBrand(brandId)
      return pRes.status(200).send(fxSuccessResponse(200, models, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }
  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ICarDataInput = pReq.only(['name', 'icon', 'type'])
      if (vData?.icon && vData?.icon.includes('temp')) {
        vData.icon = await moveImages(vData.icon)
      }
      const vResponse: ICarDataInstance | null = await ClassCarDataService.create(vData)
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
      const vData: ICarDataInput = pReq.only(['id', 'name', 'icon', 'type'])
      if (vData?.icon && vData?.icon.includes('temp')) {
        vData.icon = await moveImages(vData.icon)
      }
      const vResponse: ICarDataInstance | null = await ClassCarDataService.update(vData)
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
      const vResponse: boolean = await ClassCarDataService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }

  async autoCreate(_pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vRutaJSON: any = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../carData.json'), 'utf-8'))
      const data: ICarDataAttributes[] = []
      for (const item of vRutaJSON.moto.models) {
        if (item) {
          data.push({
            name: item,
            icon: '',
            type: 2,
            parentId: null,
            isCar: false,
            isMoto: true
          })
        }
      }
      for (const item of vRutaJSON.car.models) {
        if (item) {
          data.push({
            name: item,
            icon: '',
            type: 2,
            parentId: null,
            isCar: true,
            isMoto: false
          })
        }
      }
      for (const item of vRutaJSON.moto.brands) {
        if (item) {
          data.push({
            name: item,
            icon: '',
            type: 4,
            parentId: null,
            isCar: false,
            isMoto: true
          })
        }
      }
      for (const item of vRutaJSON.car.brands) {
        if (item) {
          data.push({
            name: item,
            icon: '',
            type: 4,
            parentId: null,
            isCar: true,
            isMoto: false
          })
        }
      }
      for (const item of vRutaJSON.color) {
        if (item) {
          data.push({
            name: item,
            icon: '',
            type: 3,
            parentId: null,
            isCar: true,
            isMoto: true
          })
        }
      }

      const vResponse: ICarDataAttributes[] = await ClassCarDataService.createMany(data)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new CarDataController()
