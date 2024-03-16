import express from 'express'
import controller from '../../controller/User/AuthController'
import { authMiddleware } from '../../middlewares/auth'
const router = express.Router()

router.route('/phone').post(controller.registerOrCreateUserForNumber)

// router.route('/NearbyDrivers').post(controller.NearbyDrisvers)

router.route('/update').post(authMiddleware('client'), controller.update)

router.route('/me').get(authMiddleware('client'), controller.me)

router.route('/register').post(controller.register)

router.route('/login').post(controller.login)

router.route('/verifiedUserCode').post(controller.verifiedUserCode)

router.route('/disconnect').post(authMiddleware('client'), controller.disconnect)

router.route('/delete').post(authMiddleware('client'), controller.delete)

export default router
// avatar
// name
// email
// password
// phoneCode
// phoneNumber
// vehicleType