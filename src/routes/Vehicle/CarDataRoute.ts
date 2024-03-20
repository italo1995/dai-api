import express from 'express'
import { authMiddleware } from '../../middlewares/auth'
import controller from '../../controller/Vehicle/CarDataController'

const router = express.Router()

router.route('/show').get(controller.show)
router.route('/all').get(controller.all)
router.route('/brand/:brandId/models').get(controller.getModelsByBrand) //filtra todos los modelos de la marca
router.route('/update').post(authMiddleware('admin'), controller.update)
router.route('/store').post(authMiddleware('admin'), controller.create)
router.route('/delete').post(authMiddleware('admin'), controller.destroy)



export default router