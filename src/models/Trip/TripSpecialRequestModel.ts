import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface ITripSpecialRequestAttributes {
  id: string
  tripId: number
  vehicleAdditionalId: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface ITripSpecialRequestCreationAttributes
  extends Optional<ITripSpecialRequestAttributes, 'id'> {}

export interface ITripSpecialRequestInstance
  extends Model<ITripSpecialRequestAttributes, ITripSpecialRequestCreationAttributes>,
    ITripSpecialRequestAttributes {}

export const vTripSpecialRequestAttributes: SequelizeAttributes<ITripSpecialRequestAttributes> = {
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
  vehicleAdditionalId: {
    type: DataTypes.INTEGER,
    field: 'vehicle_additional_id',
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

export function fxTripSpecialRequestFactory(sequelize: Sequelize) {
  const vDataBase = <ModelStatic<ITripSpecialRequestInstance>>sequelize.define(
    'TripOffert',
    vTripSpecialRequestAttributes,
    {
      tableName: 'trip_special_requests',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )
  vDataBase.associate = function (models: ModelRegistry) {
    const { modelTripSpecialRequest, modelVehicleAdditional } = models
    modelTripSpecialRequest.belongsTo(modelVehicleAdditional, {
      foreignKey: 'vehicle_additional_id',
      targetKey: 'id',
      as: 'vehicleAdditional',
    })
  }
  vDataBase.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vDataBase
}
