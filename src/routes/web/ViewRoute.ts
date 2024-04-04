import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import { View } from '../../controller/web/ViewController'

const router = express.Router()

router.route('/show').get(View.show)
router.route('/all').get(View.all)
router.route('/update').post(authMiddleware('admin'), View.update)
router.route('/store').post(authMiddleware('admin'), View.create)
router.route('/createMany').post(authMiddleware('admin'), View.createMany)
router.route('/delete').post(authMiddleware('admin'), View.destroy)

export default router
