import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ITripCancellationOptionAttributes {
  id: number
  tripId: number
  cancellationOptionId?: number
  comment?: string
  userId: string
  createdAt?: Date
  updatedAt?: Date
}

interface ITripCancellationOptionCreationAttributes
  extends Optional<ITripCancellationOptionAttributes, 'id'> {}

export interface ITripCancellationOptionInstance
  extends Model<ITripCancellationOptionAttributes, ITripCancellationOptionCreationAttributes>,
    ITripCancellationOptionAttributes {}

export const vTripCancellationOptionAttributes: SequelizeAttributes<ITripCancellationOptionAttributes> =
  {
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
    cancellationOptionId: {
      type: DataTypes.INTEGER,
      field: 'cancellation_option_id',
      allowNull: true,
      defaultValue: null,
    },
    comment: {
      type: DataTypes.STRING,
      field: 'comment',
      allowNull: true,
      defaultValue: null,
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id',
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

export function fxTripCancellationOptionFactory(sequelize: Sequelize) {
  const vDataBase = <ModelStatic<ITripCancellationOptionInstance>>sequelize.define(
    'TripCancellation',
    vTripCancellationOptionAttributes,
    {
      tableName: 'trip_cancellation_options',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  vDataBase.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vDataBase
}
