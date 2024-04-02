import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import { staff } from '../../controller/web/StaffController'

const router = express.Router()

router.route('/show').get(staff.show)
router.route('/all').get(staff.all)
router.route('/user/all').get(staff.all)
router.route('/user/store').post(staff.all)
router.route('/update').post(authMiddleware('admin'), staff.update)
router.route('/store').post(authMiddleware('admin'), staff.create)
router.route('/delete').post(authMiddleware('admin'), staff.destroy)

export default router
