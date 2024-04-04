import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/Trip/TripController'

const router = express.Router()

router.route('/show').get(authMiddleware('client'), controller.show)
router.route('/showActive').get(authMiddleware('client'), controller.showActive)
router.route('/showTripActive').get(authMiddleware('client'), controller.showTripActive)
router.route('/all').get(authMiddleware('client'), controller.all)
router.route('/allAdmin').get(authMiddleware('operator'), controller.allAdmin)
router.route('/update').post(authMiddleware('client'), controller.update)
router.route('/store').post(authMiddleware('client'), controller.create)
router.route('/hidde').post(authMiddleware('client'), controller.hidden)
router.route('/showPanic').get(controller.showPanic)

export default router
