/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Sequelize } from 'sequelize'
import { type ModelStatic, isAssociatable } from '../types/SequelizeTypes'
import config from '../config/config'
import AppConfig from '../config/AppConfig'
import { fxUserFactory } from './User/User'
import { fxUserCodeFactory } from './User/UserCode'
import { fxErrorReportingFactory } from './ErrorReporting'
import { fxTypeFileUserFactory } from './User/TypeFileUser'
import { fxCountryFactory } from './Locations/Country'
import { fxDriverDetailFactory } from './User/DriverDetail'
import { fxVehicleAdditionalFactory } from './Vehicle/VehicleAdditionalModels'
import { fxVehicleTypeFactory } from './Vehicle/VehicleTypeModels'
import { fxBannerFactory } from './web/BannerModel'
import { fxServiceFactory } from './web/ServiceModel'
import { fxReviewFactory } from './ReviewModel'
import { fxNewFactory } from './web/NewsModel'
import { fxUserAddressFactory } from './Trip/UserAddressModel'
import { fxTripFactory } from './Trip/TripModel'
import { fxTripPaymentFactory } from './Trip/TripPaymentModel'
import { fxTripRouteFactory } from './Trip/TripRouteModel'
import { fxCurrencyFactory } from './CurrencyModel'
import { fxPaymentMethodFactory } from './PaymentMethodModel'
import { fxTripTravelFactory } from './Trip/TripTravelModel'
import { fxTripDeliveryFactory } from './Trip/TripDeliveryModel'
import { fxTripOffertFactory } from './Trip/TripOffertModel'
import { fxTripSpecialRequestFactory } from './Trip/TripSpecialRequestModel'
import { fxRangePriceFactory } from './Locations/RangePriceModel'
import { fxUserRatingFactory } from './User/UserRatingModel'
import { fxCompanyParameterFactory } from './web/CompanyParameterModel'
import { fxCancellationOptionFactory } from './Trip/CancellationOptionModel'
import { fxTripCancellationOptionFactory } from './Trip/TripCancellationOptionModel'
import { fxRegionFactory } from './Locations/Region'
import { fxCityFactory } from './Locations/City'

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
  modelCity
}

export type ModelRegistry = typeof models
export type ModelRegistryKeys = keyof typeof models

Object.values(models).forEach((model: ModelStatic<any>) => {
  if (isAssociatable<ModelRegistry>(model)) {
    model.associate(models)
  }
})


export default sequelize
