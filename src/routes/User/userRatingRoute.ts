import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/User/UserRatingController'

const router = express.Router()

router.route('/show').get(controller.show)
router.route('/all').get(controller.all)
router.route('/update/:userId/:type').post(controller.updateAverageRating)
router.route('/store').post(controller.create)
router.route('/delete').post(authMiddleware('admin'),controller.destroy)

export default router