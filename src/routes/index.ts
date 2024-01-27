import express from 'express'
import AuthRoute from './User/AuthRoute'
import CountryRoute from './Location/Country'
import FileRoute from './FileRoute'
import server from './server'
import VehicleAdditional from './Vehicle/VehicleAdditionalRoute'

const router = express.Router()

router.use('/auth', AuthRoute)
router.use('/file', FileRoute)
router.use('/server', server)
router.use('/country', CountryRoute)
router.use('/VehicleAdditional', VehicleAdditional)

export default router
