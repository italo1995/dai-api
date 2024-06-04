import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/User/TypeFileUserController'

const router = express.Router()

router.route('/show').get(controller.show)
router.route('/all').get(controller.show)
router.route('/update').get(authMiddleware('operator'), controller.update)
router.route('/store').post(authMiddleware('operator'), controller.create)

export default router
