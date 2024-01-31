import express from 'express'
import { authMiddleware } from '../middlewares/auth'
import controller from '../controller/ReviewController'

const router = express.Router()

router.route('/show').get(controller.show)
router.route('/all').get(controller.all)
router.route('/update').post(authMiddleware('admin'), controller.update)
router.route('/create').get(controller.create)

export default router