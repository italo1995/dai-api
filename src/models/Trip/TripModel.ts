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
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
enum ETypeService {
  MOTO = 'moto',
  CAR = 'car',
  DELIVERY = 'delivery',
  TRAVEL = 'travel',
}
export enum EStatusTrip {
  PENDIENTE = 'buscando driver',
  ACEPTADO = 'traslado en proceso',
  FINALIZADO = 'traslado exitoso',
  CANCELADO = 'cancelado'
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
    defaultValue: null
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
  currencyId: {
    type: DataTypes.INTEGER,
    field: 'currency_id'
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
    defaultValue: null
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
    const { modelTrip, modelTripPayment, modelTripRoute, modelUser, modelTripDelivery, modelTripSpecialRequest } = models
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
  }
  vTrip.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vTrip
}
