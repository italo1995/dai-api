import express from 'express'
import controller from '../../controller/Marketplace/MarketplaceOrderController'
import { authMiddleware } from '../../middlewares/auth'

const router = express.Router()

// [Orden 2/8] El cliente convierte su carrito activo en un pedido real.
router.route('/store').post(authMiddleware('client'), controller.create)

export default router
