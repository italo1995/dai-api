import express from 'express'
import controller from '../../controller/User/AuthController'
import { authMiddleware } from '../../middlewares/auth'
const router = express.Router()

router.route('/approve').post(authMiddleware('operator'), controller.approve)

export default router
