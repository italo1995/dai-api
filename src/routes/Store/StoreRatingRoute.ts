import express from 'express'
import controller from '../../controller/Store/StoreRatingController'
import { authMiddleware } from '../../middlewares/auth'

const router = express.Router()

router.route('/show').get(controller.show)
router.route('/all').get(controller.all)
router.route('/allAdmin').get(authMiddleware('operator'), controller.allAdmin)
router.route('/rate').post(authMiddleware('client'), controller.rate)
router.route('/delete').post(authMiddleware('operator'), controller.destroy)

export default router
