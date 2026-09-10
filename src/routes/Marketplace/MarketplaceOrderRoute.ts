import express from 'express'
import controller from '../../controller/Marketplace/MarketplaceOrderController'
import { authMiddleware } from '../../middlewares/auth'

const router = express.Router()

// [Orden 2/8] El cliente convierte su carrito activo en un pedido real.
router.route('/store').post(authMiddleware('client'), controller.create)
// [Orden 3/8] El comercio confirma el pedido y fija el tiempo de preparacion.
router.route('/confirm').post(authMiddleware('store'), controller.confirm)
// [Orden 7/8] El comercio cancela el pedido.
router.route('/cancel').post(authMiddleware('store'), controller.cancel)
// [Orden 8/8] Listado y detalle - cualquier usuario logueado; el service hace el scoping por rol.
router.route('/all').get(authMiddleware('authenticated'), controller.all)
router.route('/show').get(authMiddleware('authenticated'), controller.show)

export default router
