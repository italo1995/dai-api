import express from 'express'
import controller from '../../controller/Transfers/TransferController'
const router = express.Router()

router.route('/market/show').get(controller.show)

export default router