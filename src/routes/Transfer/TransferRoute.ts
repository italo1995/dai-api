import express from 'express'
import controller from '../../controller/Trip/TransferController'
const router = express.Router()

router.route('/market/show').get(controller.market)

export default router