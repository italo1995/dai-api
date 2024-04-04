import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/web/ReviewController'

const router = express.Router()

router.route('/show').get(controller.show)
router.route('/all').get(controller.all)
router.route('/update').post(authMiddleware('admin'), controller.update)
router.route('/store').post(authMiddleware('client'), controller.create)
router.route('/delete').post(authMiddleware('admin'), controller.destroy)

export default router
