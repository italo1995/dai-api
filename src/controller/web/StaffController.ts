import type { NextFunction, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import staffService from '../../services/web/StaffService'
import type { IStaffAttributes, staffReponseAll, staffInstance } from '../../models/web/StaffModel'
import { fxSuccessResponse, fxErrorResponse } from '../../utils/helpers'
import StaffViewService from '../../services/web/StaffViewService'
import type { staffViewAttributes } from '../../models/web/StaffViewModel'
import ClassUserService from '../../services/User/UserService'
import type { IResponseAllUser, IUserInput } from '../../types/User'
import type { IUserInstance } from '../../models/User/UserModel'

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
      const vData: IStaffAttributes = pReq.only(['name'])
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
      const vData: IStaffAttributes = pReq.only(['id', 'name'])

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

  // Faltaba: el panel (ListItemsComponent generico, vURI='staff/user') siempre llama
  // {vURI}/delete al borrar una fila de la lista de usuarios Staff - o sea POST
  // staff/user/delete - pero esa ruta nunca existia (solo /staff/delete, que borra la
  // Asignacion, no la persona). El boton de borrar un usuario Staff fallaba en 404 silencioso
  // (sin ningun aviso visible) desde que se implemento esta seccion. Encontrado probando en
  // vivo en produccion. Reusa ClassUserService.softDeleteRecord, mismo patron que
  // UserController.destroy - un usuario Staff es un User comun con rolId 1 o 2.
  async destroyUser(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      // El id de User es un UUID (string) - softDeleteRecord esta tipado como (pId: number) pero
      // es un typing flojo preexistente (UserController.destroy hace exactamente lo mismo), no
      // afecta a Sequelize en runtime. Se mantiene el mismo patron ya usado ahi.
      const vId: number = pReq.input('id', 'string')
      const vResponse: boolean = await ClassUserService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  },
}
