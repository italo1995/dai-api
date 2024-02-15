import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ITripDeliveryAttributes {
  id: string
  tripId: string
  toSearch?: string
  createdAt?: Date
  updatedAt?: Date
}
interface ITripDeliveryCreationAttributes extends Optional<ITripDeliveryAttributes, 'id'> {}

export interface ITripDeliveryInstance
  extends Model<ITripDeliveryAttributes, ITripDeliveryCreationAttributes>,
    ITripDeliveryAttributes {}

export const vTripDeliveryAttributes: SequelizeAttributes<ITripDeliveryAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  tripId: {
    type: DataTypes.UUID,
    field: 'trip_id',
  },
  toSearch: {
    type: DataTypes.STRING,
    field: 'to_search',
    defaultValue: null,
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
}

export function fxTripDeliveryFactory(sequelize: Sequelize) {
  const vTripDelivery = <ModelStatic<ITripDeliveryInstance>>sequelize.define('Trip_delivery', vTripDeliveryAttributes, {
    tableName: 'trip_delivery',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
  })

  vTripDelivery.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vTripDelivery
}
