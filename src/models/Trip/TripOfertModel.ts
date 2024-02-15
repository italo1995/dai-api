import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ITripOfertAttributes {
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
interface ITripOfertCreationAttributes extends Optional<ITripOfertAttributes, 'id'> {}

export interface ITripOfertInstance
  extends Model<ITripOfertAttributes, ITripOfertCreationAttributes>,
    ITripOfertAttributes {}

export const vTripOfertAttributes: SequelizeAttributes<ITripOfertAttributes> = {
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
    allowNull: false
  },
}

export function fxTripOfertFactory(sequelize: Sequelize) {
  const vTripOfert = <ModelStatic<ITripOfertInstance>>sequelize.define(
    'Trip_oferts',
    vTripOfertAttributes,
    {
      tableName: 'trip_oferts',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true
    }
  )

  vTripOfert.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vTripOfert
}
