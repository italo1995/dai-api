import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/Transfers/UserAddressController'

const router = express.Router()

router.route('/show').get(authMiddleware('client'),controller.show)
router.route('/all').get(authMiddleware('client'),controller.all)
router.route('/update').post(authMiddleware('client'), controller.update)
router.route('/store').post(authMiddleware('client'), controller.create)
router.route('/destroy').post(authMiddleware('client'), controller.destroy)

export default router