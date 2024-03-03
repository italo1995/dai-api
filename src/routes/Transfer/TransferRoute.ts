import express from 'express'
import controller from '../../controller/Trip/TransferController'
import { authMiddleware } from '../../middlewares/auth'
const router = express.Router()

router.route('/marker/show/:name?').get(authMiddleware('client'), controller.marker)
router.route('/marker/showClient/:name?').get(authMiddleware('client'), controller.clientMarker)

export default router