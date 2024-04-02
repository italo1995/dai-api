import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ICancellationOptionAttributes {
  id: number
  name: number
  type?: ETypeCancellationOption
  isClient: boolean
  isDriver: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
export enum ETypeCancellationOption {
  DRIVER = 0,
  CLIENT = 1,
}
interface ICancellationOptionCreationAttributes
  extends Optional<ICancellationOptionAttributes, 'id'> {}

export interface ICancellationOptionInstance
  extends Model<ICancellationOptionAttributes, ICancellationOptionCreationAttributes>,
    ICancellationOptionAttributes {}

export const vCancellationOptionAttributes: SequelizeAttributes<ICancellationOptionAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
  },
  type: {
    type: DataTypes.INTEGER,
    field: 'type',
    allowNull: true,
    defaultValue: null,
  },
  isClient: {
    type: DataTypes.BOOLEAN,
    field: 'is_client',
    allowNull: true,
    defaultValue: false,
  },
  isDriver: {
    type: DataTypes.BOOLEAN,
    field: 'is_driver',
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
    defaultValue: null,
    allowNull: true,
  },
}

export function fxCancellationOptionFactory(sequelize: Sequelize) {
  const vDataBase = <ModelStatic<ICancellationOptionInstance>>sequelize.define(
    'CancellationOption',
    vCancellationOptionAttributes,
    {
      tableName: 'cancellation_options',
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
