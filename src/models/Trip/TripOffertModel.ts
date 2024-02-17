import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ITripOffertAttributes {
  id: string
  tripId: string
  clientId: string
  driverId: string
  amount: string
  status?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface ITripOffertCreationAttributes extends Optional<ITripOffertAttributes, 'id'> {}

export interface ITripOffertInstance
  extends Model<ITripOffertAttributes, ITripOffertCreationAttributes>,
    ITripOffertAttributes {}

export const vTripOffertAttributes: SequelizeAttributes<ITripOffertAttributes> = {
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
  clientId: {
    type: DataTypes.UUID,
    field: 'client_id',
  },
  driverId: {
    type: DataTypes.UUID,
    field: 'driver_id',
  },
  amount: {
    type: DataTypes.STRING,
    field: 'amount',
  },
  status: {
    type: DataTypes.STRING,
    field: 'status',
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
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deletedAt',
    defaultValue: null,
    allowNull: true
  },
}

export function fxTripOffertFactory(sequelize: Sequelize) {
  const vTripOffert = <ModelStatic<ITripOffertInstance>>sequelize.define(
    'TripOffert',
    vTripOffertAttributes,
    {
      tableName: 'trip_offerts',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true
    }
  )

  vTripOffert.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vTripOffert
}
