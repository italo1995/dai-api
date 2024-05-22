import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/Payments/BranchController'

const router = express.Router()

router.route('/show').get(controller.show)
router.route('/all').get(controller.all)
router.route('/update').post(authMiddleware('operator'), controller.update)
router.route('/store').post(authMiddleware('operator'), controller.create)
router.route('/delete').post(authMiddleware('operator'), controller.destroy)

export default router
