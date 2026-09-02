import express from 'express'
import { authMiddleware } from '../middlewares/auth'
import controller from '../controller/ErrorReportingController'

const router = express.Router()

router.route('/all').get(authMiddleware('operator'), controller.all)

export default router
