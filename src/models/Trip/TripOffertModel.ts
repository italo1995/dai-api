import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface ITripOffertAttributes {
  id: string
  tripId: number
  clientId: string
  driverId: string
  amount: string
  currencyId?: number
  duration?: string
  durationInMs?: number
  distance?: string
  status?: ETripOffertStatus
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
export enum ETripOffertStatus {
  ESPERA = '1',
  ACEPTADA = '2',
  CANCELADA = '3',
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
    type: DataTypes.INTEGER,
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
  currencyId: {
    type: DataTypes.INTEGER,
    field: 'currency_id',
  },
  duration: {
    type: DataTypes.STRING,
    field: 'duration',
    allowNull: true,
    defaultValue: null,
  },
  durationInMs: {
    type: DataTypes.NUMBER,
    field: 'duration_in_ms',
    allowNull: true,
    defaultValue: null,
  },
  distance: {
    type: DataTypes.STRING,
    field: 'distance',
    allowNull: true,
    defaultValue: null,
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
    allowNull: true,
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
      paranoid: true,
    }
  )
  vTripOffert.associate = function (models: ModelRegistry) {
    const { modelCurrency, modelTripOffert, modelUser } = models
    modelTripOffert.belongsTo(modelCurrency, {
      foreignKey: 'currency_id',
      targetKey: 'id',
      as: 'currency',
    })
    modelTripOffert.belongsTo(modelUser, {
      foreignKey: 'driver_id',
      targetKey: 'id',
      as: 'driver',
    })
  }
  vTripOffert.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vTripOffert
}
