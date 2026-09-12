import express from 'express'
import controller from '../../controller/Media/MediaLibraryItemController'
import { authMiddleware } from '../../middlewares/auth'

const router = express.Router()

router.route('/show').get(controller.show)
router.route('/all').get(controller.all)
router.route('/allAdmin').get(authMiddleware('operator'), controller.allAdmin)
router.route('/store').post(authMiddleware('operator'), controller.create)
router.route('/update').post(authMiddleware('operator'), controller.update)
router.route('/delete').post(authMiddleware('operator'), controller.destroy)

export default router
