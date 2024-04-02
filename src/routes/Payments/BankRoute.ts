import express from 'express'
// import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/Payments/BankController'

const router = express.Router()

router.route('/show').get(controller.show)
router.route('/all').get(controller.all)
// TODO
router.route('/update').post(controller.update)
router.route('/store').post(controller.create)
router.route('/delete').post(controller.destroy)

export default router
