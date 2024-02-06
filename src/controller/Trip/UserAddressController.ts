import type { NextFunction, Request, Response } from 'express'
import type { UUID } from 'crypto'
import { fxSuccessResponse, fxErrorResponse, moveImages } from '../../utils/helpers'
import type { IUserAddressInput, IResponseAllUserAddress } from '../../types/TransferType'
import ClassUserAddressService from '../../services/Trip/UserAddressService'
import type { IUserAddressInstance } from '../../models/Trip/UserAddress'

class UserAddressController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vUserId: UUID = pReq.auth.id
      const vId: number = Number(pReq.query.id)

      const vResponse: IUserAddressInstance | null = await ClassUserAddressService.show(vId, vUserId)
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

  async all(pReq:Request, pRes: Response, pNext: NextFunction) {
    try{
      const vParam: any = pReq.query
      const vUserId = pReq.auth.id
      vParam.userId = vUserId
      const vResponse: IResponseAllUserAddress | IUserAddressInstance[] = await ClassUserAddressService.all(vParam)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { data: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vUserId = pReq.auth.id
      const vData: IUserAddressInput = pReq.only([
        'name',
        'address',
        'reference',
        'lat',
        'lon',
        'file',
      ])
      if (vData?.file) {
        const vRouteAvatarImages = await moveImages(vData.file)
        vData.file = vRouteAvatarImages
      }
      vData.userId = vUserId
      const vResponse: IUserAddressInstance | null = await ClassUserAddressService.create(vData)
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
      const vData: IUserAddressInput = pReq.only([
        'id',
        'name',
        'address',
        'reference',
        'lat',
        'lon',
        'file',
      ])
      if (vData?.file) {
        const vRouteAvatarImages = await moveImages(vData.file)
        vData.file = vRouteAvatarImages
      }
      const vUserId = pReq.auth.id
      vData.userId = vUserId
      const vResponse: IUserAddressInstance | null = await ClassUserAddressService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { data: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: vResponse }))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = pReq.input('id', 'number')
      const vUserId: UUID = pReq.auth.id
      const vResponse: boolean = await ClassUserAddressService.softDeleteRecord(vId, vUserId)
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
export default new UserAddressController()
