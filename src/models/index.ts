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
const models = {
  modelUser,
  modelUserCode,
  modelErrorReporting,
  modelCountry,
  modelTypeFileUser,
  modelDriverDetail,
  modelVehicleAdditional,
  modelVehicleType
}

export type ModelRegistry = typeof models
export type ModelRegistryKeys = keyof typeof models

Object.values(models).forEach((model: ModelStatic<any>) => {
  if (isAssociatable<ModelRegistry>(model)) {
    model.associate(models)
  }
})


export default sequelize
