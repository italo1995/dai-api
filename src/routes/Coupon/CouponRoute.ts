import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/Coupon/CouponController'

const router = express.Router()

// A diferencia de otros catalogos (PaymentMethod/Currency), show/all tambien quedan detras de
// authMiddleware('operator') - no tiene sentido exponer publicamente el listado de codigos de
// cupon. El cliente nunca llama estos endpoints; solo interactua via cart/applyCoupon (que busca
// por code puntual, sin listar nada).
router.route('/show').get(authMiddleware('operator'), controller.show)
router.route('/all').get(authMiddleware('operator'), controller.all)
// Mismo controller.all que /all - a diferencia de otros catalogos, aca no hay una version
// "publica" distinta de la de admin (todo el recurso ya esta detras de authMiddleware), asi que
// no hace falta un CouponService.allAdmin aparte. Existe solo porque <app-list-items vIsAdmin>
// (el componente generico que usa el panel) siempre pide {vURI}/allAdmin.
router.route('/allAdmin').get(authMiddleware('operator'), controller.all)
router.route('/update').post(authMiddleware('operator'), controller.update)
router.route('/store').post(authMiddleware('operator'), controller.create)
router.route('/delete').post(authMiddleware('operator'), controller.destroy)

export default router
