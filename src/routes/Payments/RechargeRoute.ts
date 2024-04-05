import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import { recharge } from '../../controller/Payments/RechargeController'

const router = express.Router()

router.route('/show').get(recharge.show)
router.route('/all').get(recharge.all)
router.route('/update').post(authMiddleware('admin'), recharge.update)
router.route('/store').post(authMiddleware('admin'), recharge.create)
router.route('/delete').post(authMiddleware('admin'), recharge.destroy)

export default router
