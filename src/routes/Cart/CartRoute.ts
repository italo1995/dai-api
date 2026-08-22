import express from 'express'
import controller from '../../controller/Cart/CartController'
import { authMiddleware } from '../../middlewares/auth'

const router = express.Router()

router.route('/show').get(authMiddleware('client'), controller.show)
router.route('/addItem').post(authMiddleware('client'), controller.addItem)
router.route('/updateItem').post(authMiddleware('client'), controller.updateItem)
router.route('/removeItem').post(authMiddleware('client'), controller.removeItem)
router.route('/clear').post(authMiddleware('client'), controller.clear)

export default router
