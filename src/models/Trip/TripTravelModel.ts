import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ITripTravelAttributes {
  id: string
  tripId: string
  toSearch?: string
  createdAt?: Date
  updatedAt?: Date
}
interface ITripTravelCreationAttributes extends Optional<ITripTravelAttributes, 'id'> {}

export interface ITripTravelInstance
  extends Model<ITripTravelAttributes, ITripTravelCreationAttributes>,
    ITripTravelAttributes {}

export const vTripTravelAttributes: SequelizeAttributes<ITripTravelAttributes> = {
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

export function fxTripTravelFactory(sequelize: Sequelize) {
  const vTrip = <ModelStatic<ITripTravelInstance>>sequelize.define('Trip_travel', vTripTravelAttributes, {
    tableName: 'trip_travel',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
  })

  vTrip.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vTrip
}
