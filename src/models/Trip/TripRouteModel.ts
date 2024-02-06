import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ITripRouteAttributes {
  id: string
  tripId: number
  isInit: boolean
  isEnd: boolean
  orden: number
  address: string
  reference: string
  referencePointImage: string
  lat: number
  lon: number
  currencyId: number
  userAddressId: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface ITripRouteCreationAttributes extends Optional<ITripRouteAttributes, 'id'> {}

export interface ITripRouteInstance
  extends Model<ITripRouteAttributes, ITripRouteCreationAttributes>,
    ITripRouteAttributes {}

export const vTripRouteAttributes: SequelizeAttributes<ITripRouteAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  tripId: {
    type: DataTypes.NUMBER,
    field: 'trip_id',
  },
  isInit: {
    type: DataTypes.BOOLEAN,
    field: 'is_init',
    allowNull: true,
    defaultValue: true
  },
  isEnd: {
    type: DataTypes.BOOLEAN,
    field: 'is_end',
    allowNull: true,
    defaultValue: false
  },
  orden: {
    type: DataTypes.NUMBER,
    field: 'orden',
    allowNull: true,
    defaultValue: null
  },
  address: {
    type: DataTypes.TEXT,
    field: 'address',
    defaultValue: '',
    allowNull: true,
  },
  reference: {
    type: DataTypes.TEXT,
    field: 'reference',
    defaultValue: '',
    allowNull: true,
  },
  referencePointImage: {
    type: DataTypes.STRING,
    field: 'reference_point_image',
    defaultValue: '',
    allowNull: true,
  },
  lat: {
    type: DataTypes.DOUBLE,
    field: 'lat',
  },
  lon: {
    type: DataTypes.DOUBLE,
    field: 'lon',
  },
  currencyId: {
    type: DataTypes.NUMBER,
    field: 'currency_id',
  },
  userAddressId: {
    type: DataTypes.NUMBER,
    field: 'user_address_id',
    allowNull: true,
    defaultValue: null
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
    allowNull: false,
  },
}

export function fxTripRouteFactory(sequelize: Sequelize) {
  const vTripRoute = <ModelStatic<ITripRouteInstance>>sequelize.define('TripRoute', vTripRouteAttributes, {
    tableName: 'trip_route',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vTripRoute.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vTripRoute
}
