import express from 'express'
import type { NextFunction, Request, Response } from 'express'
import controller from '../../controller/Store/StoreProductModifierGroupController'
import { fxErrorResponse } from '../../utils/helpers'

const router = express.Router()

function authStoreOrAdmin(pReq: Request, pRes: Response, pNext: NextFunction) {
  const vAuth: any = (pReq as any).auth
  if (vAuth && [1, 2, 4].includes(Number(vAuth.rolId))) {
    return pNext()
  }
  return pRes.status(403).send(fxErrorResponse(403, { error: 'Acceso denegado' }, 'Acceso denegado'))
}

router.route('/show').get(controller.show)
router.route('/all').get(controller.all)
router.route('/allAdmin').get(authStoreOrAdmin, controller.allAdmin)
router.route('/store').post(authStoreOrAdmin, controller.create)
router.route('/update').post(authStoreOrAdmin, controller.update)
router.route('/delete').post(authStoreOrAdmin, controller.destroy)

export default router
