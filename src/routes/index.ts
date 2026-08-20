import express from 'express'
import AuthRoute from './User/AuthRoute'
import CountryRoute from './Location/CountryRoute'
import RegionRoute from './Location/RegionRoute'
import CityRoute from './Location/CityRoute'
import FileRoute from './FileRoute'
import server from './server'
import VehicleAdditional from './Vehicle/VehicleAdditionalRoute'
import VehicleType from './Vehicle/VehicleTypeRoute'
import Banner from './web/BannerRoute'
import Service from './web/ServiceRoute'
import Review from './web/ReviewRoute'
import Transfer from './Transfer/TransferRoute'
import news from './web/NewRoute'
import UserAddress from './Transfer/UserAddressRoute'
import Currency from './Payments/CurrencyRoute'
import Trip from './trip/TripRoute'
import PaymentMethod from './Payments/PaymentMethodRoute'
import TripPayment from './trip/TripPaymentRoutes'
import TripRoute from './trip/TripRoutesRoute'
import TripOffert from './trip/TripOffertRoute'
import UserRating from './User/userRatingRoute'
import RangePrice from './Location/RangePriceRoute'
import CompanyParameter from './web/CompanyParameterRoute'
import Admin from './Admin/AdminRoute'
import CancellationOption from './trip/CancellationOptionRoute'
import TripCancellationOption from './trip/TripCancellationOptionRoute'
import TermRoute from './web/TermRoute'
import UserTransactionRoute from './User/UserTransactionRoute'
import HelpInformationRoute from './web/HelpInformationRoute'
import DataContentRoute from './web/DataContentRoute'
import CarDataRoute from './Vehicle/CarDataRoute'
import CommentRoute from './User/CommentRoute'
import BankRoute from './Payments/BankRoute'
import BranchRoute from './Payments/BranchRoute'
import SuspensionRoute from './User/SuspensionRoute'
import VerifyRoute from './User/VerifyRoute'
import UserRoute from './User/UserRoute'
import ViewRoute from './web/ViewRoute'
import StaffRoute from './web/StaffRoute'
import RechargeRoute from './Payments/RechargeRoute'
import PopupRoute from './web/PopupRoute'
import StoreRoute from './Store/StoreRoute'
import StoreScheduleRoute from './Store/StoreScheduleRoute'
import StoreProductRoute from './Store/StoreProductRoute'
import StoreDepartmentRoute from './Store/StoreDepartmentRoute'
import StoreCategoryRoute from './Store/StoreCategoryRoute'
import BusinessCategoryRoute from './Store/BusinessCategoryRoute'
import StoreRatingRoute from './Store/StoreRatingRoute'
import StoreFavoriteRoute from './Store/StoreFavoriteRoute'
import StoreProductModifierGroupRoute from './Store/StoreProductModifierGroupRoute'

const router = express.Router()

router.use('/auth', AuthRoute)
router.use('/file', FileRoute)
router.use('/server', server)
router.use('/country', CountryRoute)
router.use('/region', RegionRoute)
router.use('/city', CityRoute)
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
router.use('/admin', Admin)
router.use('/cancellationOption', CancellationOption)
router.use('/tripCancellationOption', TripCancellationOption)
router.use('/term', TermRoute)
router.use('/userTransaction', UserTransactionRoute)
router.use('/helpInformation', HelpInformationRoute)
router.use('/dataContent', DataContentRoute)
router.use('/carData', CarDataRoute)
router.use('/comment', CommentRoute)
router.use('/bank', BankRoute)
router.use('/branch', BranchRoute)
router.use('/suspension', SuspensionRoute)
router.use('/verify', VerifyRoute)
router.use('/user', UserRoute)
router.use('/view', ViewRoute)
router.use('/staff', StaffRoute)
router.use('/recharge', RechargeRoute)
router.use('/popup', PopupRoute)
router.use('/store', StoreRoute)
router.use('/storeSchedule', StoreScheduleRoute)
router.use('/storeProduct', StoreProductRoute)
router.use('/storeDepartment', StoreDepartmentRoute)
router.use('/storeCategory', StoreCategoryRoute)
router.use('/businessCategory', BusinessCategoryRoute)
router.use('/storeRating', StoreRatingRoute)
router.use('/storeFavorite', StoreFavoriteRoute)
router.use('/storeProductModifierGroup', StoreProductModifierGroupRoute)

export default router
