import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IVerifyAttributes {
  id: string
  userId: string
  appeal?: string
  reason?: string
  status: EStatusVerify
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IVerifyCreationAttributes extends Optional<IVerifyAttributes, 'id'> {}

export interface IVerifyInstance
  extends Model<IVerifyAttributes, IVerifyCreationAttributes>,
    IVerifyAttributes {}

export enum EStatusVerify {
  verified = 1,
  verifying = 2,
  denied = 3
}

export const vVerifyAttributes: SequelizeAttributes<IVerifyAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.STRING,
    field: 'user_id'
  },
  appeal: {
    type: DataTypes.TEXT,
    field: 'appeal',
    allowNull: true,
    defaultValue: null
  },
  reason: {
    type: DataTypes.TEXT,
    field: 'reason',
    allowNull: true,
    defaultValue: null
  },
  status: {
    type: DataTypes.INTEGER,
    field: 'status'
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

export function fxVerifyFactory(sequelize: Sequelize) {
  const vVerify = <ModelStatic<IVerifyInstance>>sequelize.define('Verify', vVerifyAttributes, {
    tableName: 'verify',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vVerify.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vVerify
}
