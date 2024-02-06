import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/Trip/TripController'

const router = express.Router()

router.route('/show').get(controller.show)
router.route('/all').get(controller.all)
router.route('/update').post(authMiddleware('client'), controller.update)
router.route('/create').get(authMiddleware('client'), controller.create)

export default router