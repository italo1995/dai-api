import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import { staff } from '../../controller/web/StaffController'

const router = express.Router()

router.route('/show').get(staff.show)
router.route('/all').get(staff.all)
router.route('/user/show').get(authMiddleware('operator'), staff.showUser)
router.route('/user/all').get(authMiddleware('operator'), staff.allUser)
router.route('/user/store').post(authMiddleware('operator'), staff.createUser)
router.route('/user/update').post(authMiddleware('operator'), staff.updateUser)
router.route('/user/delete').post(authMiddleware('operator'), staff.destroyUser)
router.route('/update').post(authMiddleware('operator'), staff.update)
router.route('/store').post(authMiddleware('operator'), staff.create)
router.route('/delete').post(authMiddleware('operator'), staff.destroy)

export default router
