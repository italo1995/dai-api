import type { NextFunction, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import staffService from '../../services/web/StaffService'
import type { staffAttributes, staffReponseAll, staffInstance } from '../../models/web/StaffModel'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import StaffViewService from '../../services/web/StaffViewService'
import type { staffViewAttributes } from '../../models/web/StaffViewModel'
import ClassUserService from '../../services/User/UserService'
import type { IResponseAllUser, IUserInput } from '../../types/User'
import type { IUserInstance } from '../../models/User/User'

export const staff = {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = String(pReq.query.id)

      const vResponse: staffInstance | null = await staffService.show(vId)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vResponse: staffReponseAll | staffInstance[] = await staffService.all(vParam)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },

  async showUser(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: any = pReq.input('id')
      const vResponse: IUserInstance | null = await ClassUserService.show({
        id: vId,
        isStaff: true
      })
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },

  async allUser(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      vParam.isStaff = true
      const vResponse: IUserInstance[] | IResponseAllUser = await ClassUserService.all(vParam)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: staffAttributes = pReq.only(['name'])
      const vModule: staffViewAttributes[] = pReq.input('modules', 'json')
      const vResponse: staffInstance | null = await staffService.create(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      const vViews: staffViewAttributes[] = []
      for (const item of vModule) {
        vViews.push({
          staffId: Number(vResponse.dataValues.id),
          viewId: Number(item),
        })
      }
      await StaffViewService.createMany(vViews)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  },
  async createUser(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IUserInput = pReq.only(['email', 'password', 'staffId', 'branchId', 'name'])
      if (typeof vData.password === 'string') {
        vData.password = bcrypt.hashSync(vData.password, 10)
      }
      vData.rolId = 2
      await ClassUserService.validate(vData)
      const vResponse: IUserInstance | null = await ClassUserService.create(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Creado con exito'))
    } catch (error) {
      pNext(error)
    }
  },
  async updateUser(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: IUserInput = pReq.only(['id', 'email', 'password', 'staffId', 'branchId', 'name'])
      // await ClassUserService.validate(vData)
      const vResponse: IUserInstance | null = await ClassUserService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Creado con exito'))
    } catch (error) {
      pNext(error)
    }
  },
  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vData: staffAttributes = pReq.only(['id', 'name'])

      const vResponse: staffInstance | null = await staffService.update(vData)
      if (!vResponse) {
        return pRes
          .status(500)
          .send(fxErrorResponse(500, { user: null, token: null }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Codigo verificado'))
    } catch (error) {
      pNext(error)
    }
  },

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: string = pReq.input('id', 'string')
      const vResponse: boolean = await staffService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  },
}
