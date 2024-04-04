import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ITripPanicAttributes {
  id: string
  tripId: number
  socketId?: string
  createdAt?: Date
  updatedAt?: Date
}
interface ITripPanicCreationAttributes extends Optional<ITripPanicAttributes, 'id'> {}

export interface ITripPanicInstance
  extends Model<ITripPanicAttributes, ITripPanicCreationAttributes>,
    ITripPanicAttributes {}

export const vTripPanicAttributes: SequelizeAttributes<ITripPanicAttributes> = {
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
  socketId: {
    type: DataTypes.INTEGER,
    field: 'socket_id',
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

export function fxTripPanicFactory(sequelize: Sequelize) {
  const vTripPanic = <ModelStatic<ITripPanicInstance>>sequelize.define(
    'TripPanic',
    vTripPanicAttributes,
    {
      tableName: 'trip_panics',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  vTripPanic.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vTripPanic
}
