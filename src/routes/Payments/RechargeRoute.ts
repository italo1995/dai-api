import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import { recharge } from '../../controller/Payments/RechargeController'

const router = express.Router()

router.route('/show').get(recharge.show)
router.route('/all').get(recharge.all)
router.route('/update').post(authMiddleware('operator'), recharge.update)
router.route('/verify').post(authMiddleware('operator'), recharge.verify)
router.route('/store').post(recharge.create)
router.route('/delete').post(authMiddleware('operator'), recharge.destroy)

export default router
