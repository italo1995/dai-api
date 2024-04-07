import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/User/UserController'

const router = express.Router()

router.route('/show').get(authMiddleware('admin'), controller.show)
router.route('/all').get(authMiddleware('admin'), controller.all)
router.route('/location').get(authMiddleware('admin'), controller.location)
router.route('/update').post(authMiddleware('admin'), controller.update)
router.route('/store').post(authMiddleware('admin'), controller.create)
router.route('/delete').post(authMiddleware('admin'), controller.destroy)

export default router
