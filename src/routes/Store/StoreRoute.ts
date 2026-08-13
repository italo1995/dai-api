import express from 'express'
import type { NextFunction, Request, Response } from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/Store/StoreController'
import { fxErrorResponse } from '../../utils/helpers'

const router = express.Router()

// Admin/operator (rolId 1/2) o dueño de tienda (rolId 4). El scoping por dueño se resuelve
// dentro del controller/service, no aca.
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
router.route('/approve').post(authMiddleware('operator'), controller.approve)
router.route('/reject').post(authMiddleware('operator'), controller.reject)

export default router
