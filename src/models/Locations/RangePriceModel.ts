import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IRangePriceAttributes {
  id: number
  name?: string
  cityId?: number
  regionId?: number
  countryId?: number
  isMoto?: boolean
  isCar?: boolean
  isDelivery?: boolean
  isTravel?: boolean
  baseKilometer?: number
  basePrice?: number
  extraPrice?: number
  extraKilometer?: number
  distanceToSearch?: number
  createdAt?: Date
  updatedAt?: Date 
  deletedAt?: Date
}
export enum ETypeRangePrice {
  CARRODAI = 'Carro DAI',
  MOTODAI = 'Moto DAI',
  // DELIVERY (generico, sin distinguir vehiculo) se mantiene por compatibilidad con tarifas ya
  // configuradas - MarketplaceOrderService.getQuote cae acá si no encuentra la version especifica
  // por vehiculo de abajo.
  DELIVERY = 'Delivery DAI',
  DELIVERYMOTODAI = 'Delivery Moto DAI',
  DELIVERYCARRODAI = 'Delivery Carro DAI',
  CIUDADACIUDAD = 'Ciudad a ciudad DAI',
}
interface IRangePriceCreationAttributes extends Optional<IRangePriceAttributes, 'id'> {}

export interface IRangePriceInstance
  extends Model<IRangePriceAttributes, IRangePriceCreationAttributes>,
    IRangePriceAttributes {}

export const vRangePriceModelAttributes: SequelizeAttributes<IRangePriceAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  cityId: {
    type: DataTypes.INTEGER,
    field: 'city_id',
    defaultValue: null,
    allowNull: true,
  },
  regionId: {
    type: DataTypes.INTEGER,
    field: 'region_id',
    defaultValue: null,
    allowNull: true,
  },
  countryId: {
    type: DataTypes.INTEGER,
    field: 'country_id',
    defaultValue: null,
    allowNull: true,
  },
  isMoto: {
    type: DataTypes.BOOLEAN,
    field: 'is_moto',
    defaultValue: false,
    allowNull: true,
  },
  isCar: {
    type: DataTypes.BOOLEAN,
    field: 'is_car',
    defaultValue: false,
    allowNull: true,
  },
  isDelivery: {
    type: DataTypes.BOOLEAN,
    field: 'is_delivery',
    defaultValue: false,
    allowNull: true,
  },
  isTravel: {
    type: DataTypes.BOOLEAN,
    field: 'is_travel',
    defaultValue: false,
    allowNull: true,
  },
  baseKilometer: {
    type: DataTypes.DOUBLE,
    field: 'base_kilometer',
    allowNull: true,
    defaultValue: true,
  },
  basePrice: {
    type: DataTypes.DOUBLE,
    field: 'base_price',
    allowNull: true,
    defaultValue: true,
  },
  extraPrice: {
    type: DataTypes.DOUBLE,
    field: 'extra_price',
    allowNull: true,
    defaultValue: null,
  },
  distanceToSearch: {
    type: DataTypes.INTEGER,
    field: 'distance_to_search',
    allowNull: true,
    defaultValue: null,
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
    allowNull: true,
    defaultValue: null,
  },
  extraKilometer: {
    type: DataTypes.INTEGER,
    field: 'extra_kilometer',
    allowNull: true,
    defaultValue: 1,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'createdAt',
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updatedAt',
    allowNull: false,
  },
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deletedAt',
    defaultValue: null,
    allowNull: true,
  },
}

export function fxRangePriceFactory(sequelize: Sequelize) {
  const vDateBase = <ModelStatic<IRangePriceInstance>>sequelize.define(
    'RangePrice',
    vRangePriceModelAttributes,
    {
      tableName: 'range_prices',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )
  vDateBase.associate = function (models: ModelRegistry) {
    const { modelRangePrice, modelCity, modelRegion, modelCountry } = models
    modelRangePrice.hasOne(modelCity, {
      sourceKey: 'cityId',
      foreignKey: 'id',
      as: 'city',
    })
    modelRangePrice.hasOne(modelRegion, {
      sourceKey: 'regionId',
      foreignKey: 'id',
      as: 'region',
    })
    modelRangePrice.hasOne(modelCountry, {
      sourceKey: 'countryId',
      foreignKey: 'id',
      as: 'country',
    })
  }

  vDateBase.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vDateBase
}
