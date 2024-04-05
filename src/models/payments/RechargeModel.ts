import { type Sequelize, type Model, type Optional, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface rechargeAttributes {
  id?: number
  amount?: any
  countryId?: number
  currencyId?: number
  bankId?: number
  bank?: number
  capture?: string
  reference?: string
  adminId?: number
  status?: EStatusRecharge
  reason?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface rechargeReponseAll {
  total: number
  totalPage: number
  data: rechargeInstance[]
  actualPage: number
}

interface rechargeCreationAttributes extends Optional<rechargeAttributes, 'id'> {}

export interface rechargeInstance
  extends Model<rechargeAttributes, rechargeCreationAttributes>,
    rechargeAttributes {}

export enum EStatusRecharge {
  approved = 1,
  pending = 2,
  rejected = 3,
}

export const rechargeModelAttributes: SequelizeAttributes<rechargeAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  amount: {
    type: DataTypes.FLOAT,
    field: 'amount',
  },
  countryId: {
    type: DataTypes.INTEGER,
    field: 'country_id',
  },
  currencyId: {
    type: DataTypes.INTEGER,
    field: 'currency_id',
  },
  bankId: {
    type: DataTypes.INTEGER,
    field: 'bank_id',
  },
  bank: {
    type: DataTypes.INTEGER,
    field: 'bank',
    allowNull: true,
    defaultValue: null,
  },
  capture: {
    type: DataTypes.STRING,
    field: 'capture',
    allowNull: true,
    defaultValue: null,
  },
  reference: {
    type: DataTypes.STRING,
    field: 'reference',
  },
  adminId: {
    type: DataTypes.INTEGER,
    field: 'admin_id',
  },
  status: {
    type: DataTypes.INTEGER,
    field: 'status',
  },
  reason: {
    type: DataTypes.TEXT,
    field: 'reason',
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
    allowNull: false,
  },
}

export function fxRechargeFactory(sequelize: Sequelize) {
  const recharge = <ModelStatic<rechargeInstance>>sequelize.define(
    'recharge',
    rechargeModelAttributes,
    {
      tableName: 'recharges',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  return recharge
}
