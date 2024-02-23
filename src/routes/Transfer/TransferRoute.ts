import express from 'express'
import controller from '../../controller/Trip/TransferController'
const router = express.Router()

router.route('/marker/show/:name?').get(controller.marker)
router.route('/marker/showClient/:name?').get(controller.clientMarker)

export default router