/* 
- File: TripRoutesController.ts

- Purpose: Es el controlador de auth de TripRoutes se encarga de las rutas de los viajes

- Creation: 06/02/2024  

==========Functions Manifest==========

- Dai Methods:
Para todo los caso si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1- show: Sirve un dato especifico filtrado por el id

2 - all: Sirve todos los datos guardados o paginado

3 - update: Cumple la funcion de recibir todos los datos que se pueden actualizarluego los envia a guardar en el servicio

4 - create: Esto es en caso de que en un futuro necesitos crear nuevos pero lo mas probable nunca se use

 */

import type { NextFunction, Request, Response } from 'express'
import ClassTripRouteService from '../../services/Trip/TripRouteService'
import type { ITripRouteInput, IResponseAllTripRoute } from '../../types/TripType'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import type { ITripRouteInstance } from '../../models/Trip/TripRouteModel'
import TripService from '../../services/Trip/TripService'

class TripRouteController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: ITripRouteInstance | null = await ClassTripRouteService.show(vId)
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

  async recent(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vUserId = pReq.auth.id
      vParam.userId = vUserId
      const vResponse: ITripRouteInstance[] | IResponseAllTripRoute =
        await ClassTripRouteService.recent(vParam)
      if (!vResponse) {
        return pRes.status(404).send(fxErrorResponse(404, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async delete(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: any = pReq.input('id')
      const vUserId = pReq.auth.id
      const vTripRoute = await ClassTripRouteService.show(vId)
      const vTripId = vTripRoute?.dataValues.tripId
      if (vTripId) {
        await TripService.hidden({
          id: vTripId,
          userId: vUserId,
        })
        return pRes.status(200).send(fxSuccessResponse(200, true, 'Borrado con exito'))
      }
      return pRes.status(404).send(fxErrorResponse(404, null, 'Ocurrio un error'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: IResponseAllTripRoute | ITripRouteInstance[] =
        await ClassTripRouteService.all(vParam)
      if (!vResponse) {
        return pRes.status(404).send(fxErrorResponse(404, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: ITripRouteInput = pReq.only(['name'])
      const vResponse: ITripRouteInstance | null = await ClassTripRouteService.create(vData)
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
      const vData: ITripRouteInput = pReq.only(['id', 'name'])
      const vResponse: ITripRouteInstance | null = await ClassTripRouteService.update(vData)
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
}

export default new TripRouteController()
