import express from 'express'
import AuthRoute from './User/AuthRoute'
import CountryRoute from './Location/CountryRoute'
import FileRoute from './FileRoute'
import server from './server'
import VehicleAdditional from './Vehicle/VehicleAdditionalRoute'
import VehicleType from './Vehicle/VehicleTypeRoute'
import Banner from './web/BannerRoute'
import Service from './web/ServiceRoute'
import Review from './ReviewRoute'
import Transfer from './Transfer/TransferRoute'
import news from './web/NewRoute'
import UserAddress from './Transfer/UserAddressRoute'
import Currency from './CurrencyRoute'
import Trip from './trip/TripRoute'
import PaymentMethod from './PaymentMethodRoute'
import TripPayment from './trip/TripPaymentRoutes'
import TripRoute from './trip/TripRoutesRoute'
import TripOffert from './trip/TripOffertRoute'
import UserRating from './User/userRatingRoute'
import RangePrice from './Location/RangePriceRoute'
import CompanyParameter from './web/CompanyParameterRouter'

const router = express.Router()

router.use('/auth', AuthRoute)
router.use('/file', FileRoute)
router.use('/server', server)
router.use('/country', CountryRoute)
router.use('/vehicleAdditional', VehicleAdditional)
router.use('/vehicleType', VehicleType)
router.use('/banner', Banner)
router.use('/service', Service)
router.use('/review', Review)
router.use('/transfer', Transfer)
router.use('/new', news)
router.use('/userAddress', UserAddress)
router.use('/currency', Currency)
router.use('/trip', Trip)
router.use('/paymentMethod', PaymentMethod)
router.use('/tripPayment', TripPayment)
router.use('/tripRoute', TripRoute)
router.use('/TripOffer', TripOffert)
router.use('/UserRating', UserRating)
router.use('/rangePrice', RangePrice)
router.use('/companyParameter', CompanyParameter)

export default router
