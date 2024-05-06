import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface ITripAttributes {
  id: number
  typeService: ETypeService
  userId: string
  driverId?: string
  date?: string
  status?: EStatusTrip
  price?: number
  currencyId?: number
  isPayment: number
  instructionsToDriver?: string
  cityId?: number | null
  regionId?: number | null
  countryId?: number | null
  visibility?: number | null
  isPanic?: boolean
  percentage?: number
  isNear?: boolean
  serviceDistance?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
export enum ETypeService {
  MOTO = 'moto',
  CAR = 'car',
  DELIVERY = 'delivery',
  TRAVEL = 'travel',
}
export enum EStatusTrip {
  ALL = 'all',
  PENDIENTE = 'buscando driver',
  ACEPTADO = 'traslado en proceso',
  INPLACE = 'en el sitio',
  FINALIZADO = 'traslado exitoso',
  CANCELADO = 'cancelado',
  ANULADO = 'anulado',
}
interface ITripCreationAttributes extends Optional<ITripAttributes, 'id'> {}

export interface ITripInstance
  extends Model<ITripAttributes, ITripCreationAttributes>,
    ITripAttributes {}

export const vTripAttributes: SequelizeAttributes<ITripAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  typeService: {
    type: DataTypes.STRING,
    field: 'type_service',
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
  },
  driverId: {
    type: DataTypes.UUID,
    field: 'driver_id',
  },
  date: {
    type: DataTypes.STRING,
    field: 'date',
    allowNull: true,
    defaultValue: null,
  },
  status: {
    type: DataTypes.STRING,
    field: 'status',
    defaultValue: null,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    field: 'price',
    defaultValue: null,
    allowNull: true,
  },
  percentage: {
    type: DataTypes.FLOAT,
    field: 'percentage',
    allowNull: true,
    defaultValue: null,
  },
  isNear: {
    type: DataTypes.BOOLEAN,
    field: 'is_near',
    allowNull: true,
    defaultValue: false,
  },
  currencyId: {
    type: DataTypes.INTEGER,
    field: 'currency_id',
  },
  serviceDistance: {
    type: DataTypes.STRING,
    field: 'service_distance',
    allowNull: true,
    defaultValue: 0
  },
  isPayment: {
    type: DataTypes.INTEGER,
    field: 'is_payment',
    defaultValue: false,
    allowNull: true,
  },
  instructionsToDriver: {
    type: DataTypes.STRING,
    field: 'instructions_to_driver',
    defaultValue: false,
    allowNull: true,
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
  visibility: {
    field: 'visibility',
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
  isPanic: {
    field: 'is_panic',
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
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
    allowNull: true,
    defaultValue: null,
  },
}

export function fxTripFactory(sequelize: Sequelize) {
  const vTrip = <ModelStatic<ITripInstance>>sequelize.define('Trip', vTripAttributes, {
    tableName: 'trips',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vTrip.associate = function (models: ModelRegistry) {
    const {
      modelTrip,
      modelTripPayment,
      modelTripRoute,
      modelUser,
      modelTripDelivery,
      modelTripSpecialRequest,
      modelTripTravel,
      modelReview,
    } = models
    modelTrip.hasOne(modelTripDelivery, {
      foreignKey: 'trip_id',
      sourceKey: 'id',
      as: 'delivery',
    })
    modelTrip.hasOne(modelTripPayment, {
      foreignKey: 'trip_id',
      sourceKey: 'id',
      as: 'tripPayment',
    })
    modelTrip.hasOne(modelTripTravel, {
      foreignKey: 'trip_id',
      sourceKey: 'id',
      as: 'tripTravel',
    })
    modelTrip.hasOne(modelTripRoute, {
      foreignKey: 'trip_id',
      as: 'initRoute',
    })
    modelTrip.hasOne(modelTripRoute, {
      foreignKey: 'trip_id',
      as: 'endRoute',
    })
    modelTrip.hasOne(modelUser, {
      foreignKey: 'id',
      sourceKey: 'user_id',
      as: 'user',
    })
    modelTrip.hasOne(modelUser, {
      foreignKey: 'id',
      sourceKey: 'driverId',
      as: 'driver',
    })
    modelTrip.hasMany(modelTripSpecialRequest, {
      foreignKey: 'trip_id',
      as: 'tripSpecialRequest',
    })
    modelTrip.hasOne(modelReview, {
      sourceKey: 'id',
      foreignKey: 'trip_id',
      as: 'review',
    })
  }
  vTrip.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vTrip
}
