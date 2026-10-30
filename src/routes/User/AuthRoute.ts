import express from 'express'
import controller from '../../controller/User/AuthController'
import { authMiddleware } from '../../middlewares/auth'
import passwordResetController from '../../controller/User/PasswordResetController'
const router = express.Router()

router.route('/phone').post(controller.registerOrCreateUserForNumber)

// router.route('/NearbyDrivers').post(controller.NearbyDrisvers)

router.route('/update').post(authMiddleware('client'), controller.update)

router.route('/webPushToken').post(authMiddleware('client'), controller.registerWebPushToken)

router.route('/me').get(authMiddleware('client'), controller.me)

router.route('/register').post(controller.register)

router.route('/registerStore').post(controller.registerStore)

router.route('/login').post(controller.login)

router.route('/verifiedUserCode').post(controller.verifiedUserCode)

router.route('/disconnect').post(authMiddleware('client'), controller.disconnect)

router.route('/delete').post(authMiddleware('client'), controller.delete)

// Recuperacion de contraseña de tiendas (publicos) - ver PasswordResetController.ts
router.route('/passwordReset/validateLink').post(passwordResetController.validateLink)
router.route('/passwordReset/link').post(passwordResetController.resetWithLink)
router.route('/passwordReset/requestCode').post(passwordResetController.requestCode)
router.route('/passwordReset/code').post(passwordResetController.resetWithCode)

export default router
// avatar
// name
// email
// password
// phoneCode
// phoneNumber
// vehicleType
