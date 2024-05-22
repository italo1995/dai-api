import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/User/UserController'

const router = express.Router()

router.route('/show').get(authMiddleware('operator'), controller.show)
router.route('/all').get(authMiddleware('operator'), controller.all)
router.route('/operatorAll').get(authMiddleware('operator'), controller.operatorAll)
router.route('/location').get(authMiddleware('operator'), controller.location)
router.route('/update').post(authMiddleware('operator'), controller.update)
router.route('/suspended').post(authMiddleware('operator'), controller.suspended)
router.route('/store').post(authMiddleware('operator'), controller.create)
router.route('/delete').post(authMiddleware('operator'), controller.destroy)

export default router
