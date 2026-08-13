/*
- File: StoreScheduleController.ts

- Purpose: Horario semanal de una tienda (0=Lunes...6=Domingo). Publico para lectura (la app
  necesita mostrar "abierto/cerrado" sin login), protegido para escritura (dueño de la tienda o
  admin/operator).

==========Functions Manifest==========
1 - all: GET /api/storeSchedule/all?storeId=X, publico
2 - setWeek: POST /api/storeSchedule/setWeek, reemplaza la semana completa de una tienda
 */
import type { NextFunction, Request, Response } from 'express'
import ClassStoreScheduleService from '../../services/Store/StoreScheduleService'
import ClassStoreService from '../../services/Store/StoreService'
import { fxSuccessResponse, fxErrorResponse, fxIsStoreRole, fxIsAdminRole } from '../../utils/helpers'
import type { IStoreScheduleInstance } from '../../models/Store/StoreScheduleModel'
import type { IStoreInstance } from '../../models/Store/StoreModel'
import type { IStoreScheduleSetWeekInput } from '../../types/StoreSchedule'

class StoreScheduleController {
  async all(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vStoreId: number = Number(pReq.query.storeId)
      if (!vStoreId) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'storeId es requerido'))
      }
      const vResponse: IStoreScheduleInstance[] = await ClassStoreScheduleService.allByStore(vStoreId)
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }

  async setWeek(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vAuth: any = (pReq as any).auth
      const vData: IStoreScheduleSetWeekInput = pReq.only(['storeId', 'schedules'])
      const vStoreId: number = Number(vData.storeId)
      if (!vStoreId || !Array.isArray(vData.schedules)) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'storeId y schedules son requeridos'))
      }
      const vStore: IStoreInstance | null = await ClassStoreService.show(vStoreId)
      if (!vStore) {
        return pRes.status(500).send(fxErrorResponse(500, null, 'Tienda no encontrada'))
      }
      if (fxIsStoreRole(vAuth) && vStore.dataValues.ownerId !== vAuth.id) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      if (!fxIsStoreRole(vAuth) && !fxIsAdminRole(vAuth)) {
        return pRes.status(403).send(fxErrorResponse(403, null, 'Acceso denegado'))
      }
      const vResponse: IStoreScheduleInstance[] = await ClassStoreScheduleService.setWeek({
        storeId: vStoreId,
        schedules: vData.schedules,
      })
      return pRes.status(200).send(fxSuccessResponse(200, vResponse, 'Correcto'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new StoreScheduleController()
