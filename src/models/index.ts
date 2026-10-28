/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Sequelize } from 'sequelize'
import { type ModelStatic, isAssociatable } from '../types/SequelizeTypes'
import config from '../config/config'
import AppConfig from '../config/AppConfig'
import { fxUserFactory } from './User/UserModel'
import { fxUserCodeFactory } from './User/UserCodeModel'
import { fxErrorReportingFactory } from './ErrorReporting'
import { fxTypeFileUserFactory } from './User/TypeFileUserModel'
import { fxCountryFactory } from './Locations/CountryModel'
import { fxDriverDetailFactory } from './User/DriverDetailModel'
import { fxVehicleAdditionalFactory } from './Vehicle/VehicleAdditionalModel'
import { fxVehicleTypeFactory } from './Vehicle/VehicleTypeModel'
import { fxBannerFactory } from './web/BannerModel'
import { fxServiceFactory } from './web/ServiceModel'
import { fxReviewFactory } from './web/ReviewModel'
import { fxNewFactory } from './web/NewsModel'
import { fxUserAddressFactory } from './Trip/UserAddressModel'
import { fxTripFactory } from './Trip/TripModel'
import { fxTripPaymentFactory } from './Trip/TripPaymentModel'
import { fxTripRouteFactory } from './Trip/TripRouteModel'
import { fxCurrencyFactory } from './payments/CurrencyModel'
import { fxPaymentMethodFactory } from './payments/PaymentMethodModel'
import { fxTripTravelFactory } from './Trip/TripTravelModel'
import { fxTripDeliveryFactory } from './Trip/TripDeliveryModel'
import { fxTripOffertFactory } from './Trip/TripOffertModel'
import { fxTripSpecialRequestFactory } from './Trip/TripSpecialRequestModel'
import { fxRangePriceFactory } from './Locations/RangePriceModel'
import { fxUserRatingFactory } from './User/UserRatingModel'
import { fxCompanyParameterFactory } from './web/CompanyParameterModel'
import { fxCancellationOptionFactory } from './Trip/CancellationOptionModel'
import { fxTripCancellationOptionFactory } from './Trip/TripCancellationOptionModel'
import { fxRegionFactory } from './Locations/RegionModel'
import { fxCityFactory } from './Locations/CityModel'
import { fxTermFactory } from './web/TermModel'
import { fxUserTransactionFactory } from './User/UserTransactionModel'
import { fxHelpInformationFactory } from './web/HelpInfomationModel'
import { fxDataContentFactory } from './web/DataContentModel'
import { fxCarDataFactory } from './Vehicle/CarDataModel'
import { fxCommentFactory } from './User/CommentModel'
import { fxBankFactory } from './payments/BankModel'
import { fxBranchFactory } from './payments/BranchModel'
import { fxTripPanicFactory } from './Trip/TripPanicModel'
import { fxSuspensionFactory } from './User/SuspensionModel'
import { fxVerifyFactory } from './User/VerifyModel'
import { fxDriverReportFactory } from './User/driverReportModel'
import { fxViewFactory } from './web/ViewModel'
import { fxStaffFactory } from './web/StaffModel'
import { fxStaffViewFactory } from './web/StaffViewModel'
import { fxRechargeFactory } from './payments/RechargeModel'
import { fxPopupFactory } from './web/PopupModel'
import { fxStoreFactory } from './Store/StoreModel'
import { fxStoreScheduleFactory } from './Store/StoreScheduleModel'
import { fxStoreProductFactory } from './Store/StoreProductModel'
import { fxStoreDepartmentFactory } from './Store/StoreDepartmentModel'
import { fxStoreCategoryFactory } from './Store/StoreCategoryModel'
import { fxStoreProductCategoryFactory } from './Store/StoreProductCategoryModel'
import { fxBusinessCategoryFactory } from './Store/BusinessCategoryModel'
import { fxStoreCurrencyFactory } from './Store/StoreCurrencyModel'
import { fxStorePaymentMethodFactory } from './Store/StorePaymentMethodModel'
import { fxStoreBusinessCategoryFactory } from './Store/StoreBusinessCategoryModel'
import { fxStoreRatingFactory } from './Store/StoreRatingModel'
import { fxStoreFavoriteFactory } from './Store/StoreFavoriteModel'
import { fxStoreProductModifierGroupFactory } from './Store/StoreProductModifierGroupModel'
import { fxMediaLibraryItemFactory } from './Media/MediaLibraryItemModel'
import { fxUserDeviceFactory } from './User/UserDeviceModel'
import { fxStoreProductModifierFactory } from './Store/StoreProductModifierModel'
import { fxStoreProductImageFactory } from './Store/StoreProductImageModel'
import { fxCartFactory } from './Cart/CartModel'
import { fxCartItemFactory } from './Cart/CartItemModel'
import { fxCartItemModifierFactory } from './Cart/CartItemModifierModel'
import { fxCouponFactory } from './Coupon/CouponModel'
import { fxMarketplaceOrderFactory } from './Marketplace/MarketplaceOrderModel'
import { fxMarketplaceOrderItemFactory } from './Marketplace/MarketplaceOrderItemModel'
import { fxMarketplaceOrderItemModifierFactory } from './Marketplace/MarketplaceOrderItemModifierModel'
// @ts-ignore
const database = config[AppConfig.NODE_ENV] || config.development

const sequelize = new Sequelize(database.database, database.username, database.password, {
  ...database,
  logging: false,
  dialect: database?.dialect || 'postgres',
})

export const modelUser = fxUserFactory(sequelize)
export const modelUserCode = fxUserCodeFactory(sequelize)
export const modelErrorReporting = fxErrorReportingFactory(sequelize)
export const modelCountry = fxCountryFactory(sequelize)
export const modelTypeFileUser = fxTypeFileUserFactory(sequelize)
export const modelDriverDetail = fxDriverDetailFactory(sequelize)
export const modelVehicleAdditional = fxVehicleAdditionalFactory(sequelize)
export const modelVehicleType = fxVehicleTypeFactory(sequelize)
export const modelBanner = fxBannerFactory(sequelize)
export const modelService = fxServiceFactory(sequelize)
export const modelReview = fxReviewFactory(sequelize)
export const modelNew = fxNewFactory(sequelize)
export const modelUserAddress = fxUserAddressFactory(sequelize)
export const modelTrip = fxTripFactory(sequelize)
export const modelTripPayment = fxTripPaymentFactory(sequelize)
export const modelTripRoute = fxTripRouteFactory(sequelize)
export const modelCurrency = fxCurrencyFactory(sequelize)
export const modelPaymentMethod = fxPaymentMethodFactory(sequelize)
export const modelTripTravel = fxTripTravelFactory(sequelize)
export const modelTripDelivery = fxTripDeliveryFactory(sequelize)
export const modelTripOffert = fxTripOffertFactory(sequelize)
export const modelTripSpecialRequest = fxTripSpecialRequestFactory(sequelize)
export const modelRangePrice = fxRangePriceFactory(sequelize)
export const modelUserRating = fxUserRatingFactory(sequelize)
export const modelCompanyParameter = fxCompanyParameterFactory(sequelize)
export const modelCancellationOption = fxCancellationOptionFactory(sequelize)
export const modelTripCancellationOption = fxTripCancellationOptionFactory(sequelize)
export const modelRegion = fxRegionFactory(sequelize)
export const modelCity = fxCityFactory(sequelize)
export const modelTerm = fxTermFactory(sequelize)
export const modelUserTransaction = fxUserTransactionFactory(sequelize)
export const modelHelpInformation = fxHelpInformationFactory(sequelize)
export const modelDataContent = fxDataContentFactory(sequelize)
export const modelCarData = fxCarDataFactory(sequelize)
export const modelComment = fxCommentFactory(sequelize)
export const modelBank = fxBankFactory(sequelize)
export const modelBranch = fxBranchFactory(sequelize)
export const modelTripPanic = fxTripPanicFactory(sequelize)
export const modelSuspension = fxSuspensionFactory(sequelize)
export const modelVerify = fxVerifyFactory(sequelize)
export const modelDriverReport = fxDriverReportFactory(sequelize)
export const modelView = fxViewFactory(sequelize)
export const modelStaff = fxStaffFactory(sequelize)
export const modelStaffView = fxStaffViewFactory(sequelize)
export const modelRecharge = fxRechargeFactory(sequelize)
export const modelPopup = fxPopupFactory(sequelize)
export const modelStore = fxStoreFactory(sequelize)
export const modelStoreSchedule = fxStoreScheduleFactory(sequelize)
export const modelStoreProduct = fxStoreProductFactory(sequelize)
export const modelStoreDepartment = fxStoreDepartmentFactory(sequelize)
export const modelStoreCategory = fxStoreCategoryFactory(sequelize)
export const modelStoreProductCategory = fxStoreProductCategoryFactory(sequelize)
export const modelStoreCurrency = fxStoreCurrencyFactory(sequelize)
export const modelMediaLibraryItem = fxMediaLibraryItemFactory(sequelize)
export const modelUserDevice = fxUserDeviceFactory(sequelize)
export const modelStorePaymentMethod = fxStorePaymentMethodFactory(sequelize)
export const modelBusinessCategory = fxBusinessCategoryFactory(sequelize)
export const modelStoreBusinessCategory = fxStoreBusinessCategoryFactory(sequelize)
export const modelStoreRating = fxStoreRatingFactory(sequelize)
export const modelStoreFavorite = fxStoreFavoriteFactory(sequelize)
export const modelStoreProductModifierGroup = fxStoreProductModifierGroupFactory(sequelize)
export const modelStoreProductModifier = fxStoreProductModifierFactory(sequelize)
export const modelStoreProductImage = fxStoreProductImageFactory(sequelize)
export const modelCart = fxCartFactory(sequelize)
export const modelCartItem = fxCartItemFactory(sequelize)
export const modelCartItemModifier = fxCartItemModifierFactory(sequelize)
export const modelCoupon = fxCouponFactory(sequelize)
export const modelMarketplaceOrder = fxMarketplaceOrderFactory(sequelize)
export const modelMarketplaceOrderItem = fxMarketplaceOrderItemFactory(sequelize)
export const modelMarketplaceOrderItemModifier = fxMarketplaceOrderItemModifierFactory(sequelize)

const models = {
  modelUser,
  modelUserCode,
  modelErrorReporting,
  modelCountry,
  modelTypeFileUser,
  modelDriverDetail,
  modelVehicleAdditional,
  modelVehicleType,
  modelBanner,
  modelService,
  modelReview,
  modelNew,
  modelUserAddress,
  modelTrip,
  modelTripPayment,
  modelTripRoute,
  modelCurrency,
  modelPaymentMethod,
  modelTripTravel,
  modelTripDelivery,
  modelTripOffert,
  modelTripSpecialRequest,
  modelRangePrice,
  modelUserRating,
  modelCompanyParameter,
  modelCancellationOption,
  modelTripCancellationOption,
  modelRegion,
  modelCity,
  modelTerm,
  modelUserTransaction,
  modelHelpInformation,
  modelDataContent,
  modelCarData,
  modelComment,
  modelBank,
  modelBranch,
  modelTripPanic,
  modelSuspension,
  modelVerify,
  modelDriverReport,
  modelView,
  modelStaff,
  modelStaffView,
  modelRecharge,
  modelPopup,
  modelStore,
  modelStoreSchedule,
  modelStoreProduct,
  modelStoreDepartment,
  modelStoreCategory,
  modelStoreProductCategory,
  modelStoreCurrency,
  modelMediaLibraryItem,
  modelUserDevice,
  modelStorePaymentMethod,
  modelBusinessCategory,
  modelStoreBusinessCategory,
  modelStoreRating,
  modelStoreFavorite,
  modelStoreProductModifierGroup,
  modelStoreProductModifier,
  modelStoreProductImage,
  modelCart,
  modelCartItem,
  modelCartItemModifier,
  modelCoupon,
  modelMarketplaceOrder,
  modelMarketplaceOrderItem,
  modelMarketplaceOrderItemModifier,
}

export type ModelRegistry = typeof models
export type ModelRegistryKeys = keyof typeof models

Object.values(models).forEach((model: ModelStatic<any>) => {
  if (isAssociatable<ModelRegistry>(model)) {
    model.associate(models)
  }
})

export default sequelize
