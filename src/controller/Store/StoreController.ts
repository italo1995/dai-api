/*
- File: StoreController.ts

- Purpose: Controlador de tiendas/comercios del Marketplace (DAI Food / DAI Market).
  El rol 'store' (rolId=4) solo puede ver/crear/editar/borrar sus propias tiendas; admin y
  operator pueden operar sobre cualquiera. La aprobacion/rechazo es exclusiva de admin/operator.

==========Functions Manifest==========
Para todos los casos, si ocurre cualquier error, lo envia usando NextFunction al middleware de errores.
1 - show: trae una tienda por id. Publico si esta aprobada; si no, solo el dueño o admin/operator
2 - all: endpoint publico para la app/cliente. Solo tiendas aprobadas, paginado, con
    busqueda por nombre (?search=) y filtro por categoria de negocio (?categoryId=)
3 - allAdmin: panel (dueño ve solo las propias, admin/operator ve todas con filtro opcional)
4 - create: crea una tienda. El dueño solo puede crearla para si mismo (ownerId se fuerza al propio id)
5 - update: actualiza una tienda. El dueño solo puede editar la propia, y no puede tocar isApproved/rejectionReason/ownerId
6 - approve: aprueba una tienda (admin/operator)
7 - reject: rechaza una tienda con motivo obligatorio (admin/operator)
8 - destroy: elimina (soft delete) una tienda propia o, si es admin/operator, cualquiera
 */
import type { NextFunction, Request, Response } from 'express'
import ClassStoreService, { fxToPublicStore, fxGetFavoriteStoreIdSet } from '../../services/Store/StoreService'
import type { IStoreInput, IResponseAllStore, IResponseAllStorePublic } from '../../types/Store'
import { fxSuccessResponse, fxErrorResponse, moveImages, fxIsStoreRole, fxIsAdminRole } from '../../utils/helpers'
import type { IStoreInstance } from '../../models/Store/StoreModel'

class StoreController {
  async show(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.query.id)
      const vResponse: IStoreInstance | null = await ClassStoreService.show(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      const vAuth: any = (pReq as any).auth
      const vIsOwner = fxIsStoreRole(vAuth) && vResponse.dataValues.ownerId === vAuth.id
      const vIsPrivileged = vIsOwner || fxIsAdminRole(vAuth)
      if (!vResponse.dataValues.isApproved && !vIsPrivileged) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      let vData: any = vResponse
      if (!vIsPrivileged) {
        const vFavoriteIds = vAuth?.id
          ? await fxGetFavoriteStoreIdSet(vAuth.id, [vResponse.dataValues.id])
          : undefined
        vData = fxToPublicStore(vResponse, vFavoriteIds)
      }
      return pRes.status(200).send(fxSuccessResponse(200, vData, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vParam: any = pReq.query
      const vAuth: any = (pReq as any).auth
      const vResponse: IResponseAllStorePublic = await ClassStoreService.all(vParam, vAuth?.id)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async allAdmin(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vParam: any = pReq.query
      const vOwnerId: string | undefined = fxIsStoreRole(vAuth) ? vAuth.id : undefined
      const vResponse: IResponseAllStore | IStoreInstance[] = await ClassStoreService.allAdmin(
        vParam,
        vOwnerId
      )
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async create(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData: IStoreInput = pReq.only([
        'name',
        'type',
        'ownerId',
        'phoneCode',
        'phoneNumber',
        'logo',
        'lat',
        'lon',
        'cityId',
        'regionId',
        'countryId',
        'isOpen',
        'avgPrepTimeMinutes',
        'businessCategoryIds',
      ])
      if (fxIsStoreRole(vAuth)) {
        vData.ownerId = vAuth.id
      } else if (!vData.ownerId) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'ownerId es requerido'))
      }
      if (vData?.logo && vData.logo.includes('temp')) {
        vData.logo = await moveImages(vData.logo)
      }
      const vResponse: IStoreInstance = await ClassStoreService.create(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async update(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId: number = Number(pReq.input('id', 'number'))
      const vExisting: IStoreInstance | null = await ClassStoreService.show(vId)
      if (!vExisting) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      if (fxIsStoreRole(vAuth) && vExisting.dataValues.ownerId !== vAuth.id) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      const vData: IStoreInput = pReq.only([
        'id',
        'name',
        'type',
        'phoneCode',
        'phoneNumber',
        'logo',
        'lat',
        'lon',
        'cityId',
        'regionId',
        'countryId',
        'isOpen',
        'avgPrepTimeMinutes',
        'businessCategoryIds',
      ])
      // El dueño no puede reasignar la tienda ni autoaprobarse: isApproved/rejectionReason/
      // ownerId solo se tocan via approve()/reject()/admin.
      if (vData?.logo && vData.logo.includes('temp')) {
        vData.logo = await moveImages(vData.logo)
      }
      const vResponse: IStoreInstance | null = await ClassStoreService.update(vData)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async approve(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.input('id', 'number'))
      const vResponse: IStoreInstance | null = await ClassStoreService.approve(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async reject(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vId: number = Number(pReq.input('id', 'number'))
      const vReason: string = pReq.input('rejectionReason')
      if (!vReason) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'rejectionReason es requerido'))
      }
      const vResponse: IStoreInstance | null = await ClassStoreService.reject(vId, vReason)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async destroy(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vId: number = pReq.input('id', 'number')
      const vExisting: IStoreInstance | null = await ClassStoreService.show(vId)
      if (!vExisting) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      if (fxIsStoreRole(vAuth) && vExisting.dataValues.ownerId !== vAuth.id) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      const vResponse: boolean = await ClassStoreService.softDeleteRecord(vId)
      if (!vResponse) {
        return pRes.status(500).send(fxErrorResponse(500, { data: false }, 'Ocurrio un error'))
      }
      return pRes.status(200).send(fxSuccessResponse(200, { data: true }, 'Borrado con exito'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new StoreController()
