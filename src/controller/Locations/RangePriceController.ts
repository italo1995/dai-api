import type { NextFunction, Request, Response } from 'express'
import ClassRangePriceService from '../../services/Locations/RangePriceService'
import type { IResponseAll } from '../../types/generalType'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { IRangePriceInstance } from '../../models/Locations/RangePriceModel'
import { ETypeService } from '../../models/Trip/TripModel'

class RangePriceController {

  async all (pReq:Request, pRes: Response, pNext: NextFunction) {
    try{
      const vParam: any = pReq.query
      const vResponse: IResponseAll | IRangePriceInstance[] = await ClassRangePriceService.all(vParam)
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

  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const pId: number = Number(pReq.query.id)

      const vResponse: IRangePriceInstance | null = await ClassRangePriceService.show(pId)
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
  
  async showPrice(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const typeService = pReq.input('typeService')

      const vParam = {
        city: pReq.input('city'),
        region: pReq.input('region'),
        country: pReq.input('country'),
        isCar: typeService === ETypeService.CAR || typeService === ETypeService.TRAVEL,
        isMoto: typeService === ETypeService.MOTO || typeService === ETypeService.DELIVERY,
      }
  
      const vResponse: IRangePriceInstance | null = await ClassRangePriceService.showPrice(vParam)
      if (!vResponse) {
        return pRes
          .status(404)
          .send(fxErrorResponse(404, null, 'No se encontró un rango de precios para la ubicación proporcionada.'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IRangePriceInstance = pReq.only([
        'cityId',
        'regionId',
        'countryId',
        'isMoto',
        'isCar',
        'baseKilometer',
        'basePrice',
        'extraPrice'
      ])
      const vResponse: IRangePriceInstance | null = await ClassRangePriceService.create(vData)
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
      const vData: IRangePriceInstance = pReq.only([
        'id',
        'cityId',
        'regionId',
        'countryId',
        'isMoto',
        'isCar',
        'baseKilometer',
        'basePrice',
        'extraPrice'
      ])
      const vResponse: IRangePriceInstance | null = await ClassRangePriceService.update(vData)
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
      const vResponse: boolean = await ClassRangePriceService.softDeleteRecord(vId)
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

export default new RangePriceController()
