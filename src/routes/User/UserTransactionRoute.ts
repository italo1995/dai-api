import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/User/UserTransactionController'
import { type AuthRequest } from '../../services/User/UserTransactionService'

const router = express.Router()

router.route('/show').get(controller.show)
router.route('/all').get(controller.all)
router.route('/update').post(authMiddleware('admin'), (req, res, next) => controller.update(req as unknown as AuthRequest, res, next))
router.route('/store').post(authMiddleware('admin'), (req, res, next) => controller.create(req as unknown as AuthRequest, res, next))
router.route('/delete').post(authMiddleware('admin'), controller.destroy)

export default router