import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/Locations/CountryController'

const router = express.Router()

router.route('/show').get(controller.show)
router.route('/all').get(controller.all)
router.route('/update').post(authMiddleware('admin'), controller.update)
router.route('/store').post(authMiddleware('admin'), controller.create)

export default router

/**
 * @swagger
 * components:
 *  schemas:
 *    Country:
 *      type: object
 *      properties:
 *        id:
 *          type: number
 *          description: the increment id of country
 *        name:
 *          type: string
 *          description: the name of the task
 *        flag:
 *          type: string
 *          description: the file name of the flag for country
 *      required:
 *        - name
 *      example:
 *        id: 1
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
 *  name: Countries
 *  description: Country endpoint
*/

/**
 * @swagger
 * /api/country/show:
 *  get:
 *    summary: Returns a list of Country
 *    tags: [Countries]
 *    responses:
 *      200:
 *        description: the list of Country
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Country'
 */

/**
 * @swagger
 * /api/country/all:
 *  get:
 *    summary: Returns a list of Country
 *    tags: [Countries]
 *    responses:
 *      200:
 *        description: the list of Country
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Country'
 */