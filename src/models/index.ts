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
import { fxUserAddressFactory } from './Transfer/UserAddress'
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
  modelUserAddress
}

export type ModelRegistry = typeof models
export type ModelRegistryKeys = keyof typeof models

Object.values(models).forEach((model: ModelStatic<any>) => {
  if (isAssociatable<ModelRegistry>(model)) {
    model.associate(models)
  }
})


export default sequelize
