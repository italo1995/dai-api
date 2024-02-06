import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ITripAttributes {
  id: string
  typeService: string
  userId: string
  driverId?: string
  date?: Date
  status?: string
  price?: number
  currencyId?: number
  isPayment: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
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
    type: DataTypes.DATE,
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
    type: DataTypes.NUMBER,
    field: 'currency_id'
  },
  isPayment: {
    type: DataTypes.NUMBER,
    field: 'is_payment',
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
    allowNull: false,
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

  vTrip.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vTrip
}
