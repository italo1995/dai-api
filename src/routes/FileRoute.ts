import express from 'express'
import controller from '../controller/FileController'
const router = express.Router()

router.route('/upload').post(controller.uploadFile)

router.route('/show/:folder/:fileName').get(controller.show)

export default router