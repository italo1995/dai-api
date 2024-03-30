import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/User/VerifyController'

const router = express.Router()

router.route('/show').get(controller.show)
router.route('/all').get(controller.all)
router.route('/update').post(authMiddleware('admin'), controller.update)
router.route('/store').post(controller.create)
router.route('/delete').post(authMiddleware('admin'), controller.destroy)



export default router