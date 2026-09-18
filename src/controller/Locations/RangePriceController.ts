import type { NextFunction, Request, Response } from 'express'
import ClassRangePriceService from '../../services/Locations/RangePriceService'
import type { IResponseAll } from '../../types/generalType'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import { ETypeRangePrice, type IRangePriceInstance } from '../../models/Locations/RangePriceModel'
import { ETypeService } from '../../models/Trip/TripModel'

class RangePriceController {
  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAll | IRangePriceInstance[] =
        await ClassRangePriceService.all(vParam)
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
        isCar: typeService === ETypeService.CAR,
        isMoto: typeService === ETypeService.MOTO,
        isDelivery: typeService === ETypeService.DELIVERY,
        isTravel: typeService === ETypeService.TRAVEL,
      }

      const vResponse: IRangePriceInstance | null = await ClassRangePriceService.showPrice(vParam)
      if (!vResponse) {
        return pRes
          .status(404)
          .send(
            fxErrorResponse(
              404,
              null,
              'No se encontró un rango de precios para la ubicación proporcionada.'
            )
          )
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      console.log('error :>> ', error)
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
        'isTravel',
        'isDelivery',
        'baseKilometer',
        'basePrice',
        'extraPrice',
        'name',
        'extraKilometer',
        'distanceToSearch',
      ])
      vData.isCar = false
      vData.isMoto = false
      vData.isTravel = false
      vData.isDelivery = false
      if (vData.name === ETypeRangePrice.CARRODAI) {
        vData.isCar = true
      }
      if (vData.name === ETypeRangePrice.MOTODAI) {
        vData.isMoto = true
        vData.isCar = false
      }
      if (vData.name === ETypeRangePrice.CIUDADACIUDAD) {
        vData.isTravel = true
      }
      if (vData.name === ETypeRangePrice.DELIVERY) {
        vData.isDelivery = true
      }
      if (vData.name === ETypeRangePrice.DELIVERYMOTODAI) {
        vData.isDelivery = true
        vData.isMoto = true
      }
      if (vData.name === ETypeRangePrice.DELIVERYCARRODAI) {
        vData.isDelivery = true
        vData.isCar = true
      }
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
        'isTravel',
        'isDelivery',
        'baseKilometer',
        'basePrice',
        'extraPrice',
        'name',
        'extraKilometer',
        'distanceToSearch',
      ])
      vData.isCar = false
      vData.isMoto = false
      vData.isTravel = false
      vData.isDelivery = false

      if (vData.name === ETypeRangePrice.CARRODAI) {
        vData.isCar = true
      }
      if (vData.name === ETypeRangePrice.MOTODAI) {
        vData.isMoto = true
      }
      if (vData.name === ETypeRangePrice.CIUDADACIUDAD) {
        vData.isTravel = true
      }
      if (vData.name === ETypeRangePrice.DELIVERY) {
        vData.isDelivery = true
      }
      if (vData.name === ETypeRangePrice.DELIVERYMOTODAI) {
        vData.isDelivery = true
        vData.isMoto = true
      }
      if (vData.name === ETypeRangePrice.DELIVERYCARRODAI) {
        vData.isDelivery = true
        vData.isCar = true
      }
      const vResponse: IRangePriceInstance | null = await ClassRangePriceService.update(vData)
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
      const vResponse: boolean = await ClassRangePriceService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new RangePriceController()
