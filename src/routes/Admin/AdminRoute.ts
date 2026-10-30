import express from 'express'
import controller from '../../controller/User/AuthController'
import { authMiddleware } from '../../middlewares/auth'
import passwordResetController from '../../controller/User/PasswordResetController'
const router = express.Router()

router.route('/approve').post(authMiddleware('operator'), controller.approve)

// Enlace de recuperacion de contraseña para una tienda (lo genera el admin tras verificarla).
router.route('/passwordResetLink').post(authMiddleware('operator'), passwordResetController.createLink)

export default router
