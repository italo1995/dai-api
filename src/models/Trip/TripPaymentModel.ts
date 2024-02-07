import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ITripPaymentAttributes {
  id: string
  tripId: number
  type: string
  amount: number
  currencyId?: number
  paymentMethodsId?: number
  isAprobed?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface ITripPaymentCreationAttributes extends Optional<ITripPaymentAttributes, 'id'> {}

export interface ITripPaymentInstance
  extends Model<ITripPaymentAttributes, ITripPaymentCreationAttributes>,
    ITripPaymentAttributes {}

export const vTripPaymentAttributes: SequelizeAttributes<ITripPaymentAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  tripId: {
    type: DataTypes.INTEGER,
    field: 'trip_id',
  },
  type: {
    type: DataTypes.STRING,
    field: 'type',
    allowNull: true,
    defaultValue: null
  },
  amount: {
    type: DataTypes.FLOAT,
    field: 'amount',
  },
  currencyId: {
    type: DataTypes.INTEGER,
    field: 'currency_id',
  },
  paymentMethodsId: {
    type: DataTypes.INTEGER,
    field: 'payment_method_id',
  },
  isAprobed: {
    type: DataTypes.BOOLEAN,
    field: 'is_aprobed',
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
    allowNull: false,
  },
}

export function fxTripPaymentFactory(sequelize: Sequelize) {
  const vTripPayment = <ModelStatic<ITripPaymentInstance>>sequelize.define('TripPayment', vTripPaymentAttributes, {
    tableName: 'trip_payments',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vTripPayment.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vTripPayment
}
