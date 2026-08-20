import express from 'express'
import controller from '../../controller/Store/StoreFavoriteController'
import { authMiddleware } from '../../middlewares/auth'

const router = express.Router()

router.route('/add').post(authMiddleware('client'), controller.add)
router.route('/remove').post(authMiddleware('client'), controller.remove)
router.route('/all').get(authMiddleware('client'), controller.all)

export default router
