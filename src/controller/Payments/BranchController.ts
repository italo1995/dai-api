/* 
- File: BranchController.ts

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
import ClassBranchService from '../../services/Payments/BranchService'
import type { IResponseAllBranch, IBranchInput } from '../../types/PaymentMethodType'
import { fxSuccessResponse, fxErrorResponse, moveImages } from '../../utils/helpers'
import type { IBranchInstance } from '../../models/payments/BranchModel'

class BranchController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)

      const vResponse: IBranchInstance | null = await ClassBranchService.show(vId)
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
      vParam.countryId = pReq.query.countryId ? Number(pReq.query.countryId) : undefined

      const vResponse: IResponseAllBranch | IBranchInstance[] = await ClassBranchService.all(vParam)
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
      const vData: IBranchInput = pReq.only([
        'name',
        'number',
        'email',
        'direction',
        'lat',
        'lon',
        'image',
        'referencePoint',
        'countryId'
      ])
      if (vData?.image && vData?.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      const vResponse: IBranchInstance | null = await ClassBranchService.create(vData)
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
      const vData: IBranchInput = pReq.only([
        'id',
        'name',
        'number',
        'email',
        'direction',
        'lat',
        'lon',
        'image',
        'referencePoint',
        'countryId'
      ])
      if (vData?.image && vData?.image.includes('temp')) {
        vData.image = await moveImages(vData.image)
      }
      const vResponse: IBranchInstance | null = await ClassBranchService.update(vData)
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
      const vResponse: boolean = await ClassBranchService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new BranchController()
