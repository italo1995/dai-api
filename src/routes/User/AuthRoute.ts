import express from 'express'
import controller from '../../controller/User/AuthController'
import { authMiddleware } from '../../middlewares/auth'
const router = express.Router()

router.route('/phone').post(controller.registerOrCreateUserForNumber)

router.route('/update').post(authMiddleware('client'), controller.update)

router.route('/me').get(authMiddleware('client'), controller.me)

router.route('/register').post(controller.register)

router.route('/login').post(controller.login)

router.route('/verifiedUserCode').post(controller.verifiedUserCode)

export default router
// avatar
// name
// email
// password
// phoneCode
// phoneNumber
// vehicleType
/**
 * @swagger
 * components:
 *  schemas:
 *    Auth:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          description: the auto-generate id of user
 *        name:
 *          type: string
 *          description: the name of the task
 *        avatar:
 *          type: string
 *          description: the file name of the avatar for user
 *      required:
 *        - name
 *      example:
 *        id: asdasda-dsadsa-dsadsa
 *        name: Venezuela
 *        flag: fileFlagVenezuela.png
 *
 *  parameters:
 *    taskId:
 *      in: path
 *      name: id
 *      required: true
 *      schema:
 *        type: string
 *      description: the task id
 */

/**
 * @swagger
 * tags:
 *  name: Auth
 *  description: Auth endpoint
*/

/**
 * @swagger
 * /api/auth/me:
 *  get:
 *    summary: Returns a profile data
 *    tags: [Auth]
 *    responses:
 *      200:
 *        description: the profile data
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Auth'
 */