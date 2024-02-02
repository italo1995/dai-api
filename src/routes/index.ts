import express from 'express'
import AuthRoute from './User/AuthRoute'
import CountryRoute from './Location/Country'
import FileRoute from './FileRoute'
import server from './server'
import VehicleAdditional from './Vehicle/VehicleAdditionalRoute'
import VehicleType from './Vehicle/VehicleTypeRoute'
import Banner from './web/BannerRoute'
import Service from './web/ServiceRoute'
import Review from './ReviewRoute'
import news from './web/NewRoute'

const router = express.Router()

router.use('/auth', AuthRoute)
router.use('/file', FileRoute)
router.use('/server', server)
router.use('/country', CountryRoute)
router.use('/VehicleAdditional', VehicleAdditional)
router.use('/vehicleType', VehicleType)
router.use('/Banner', Banner)
router.use('/Service', Service)
router.use('/Review', Review)
router.use('/new', news)



export default router
