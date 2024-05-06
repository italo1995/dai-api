import { type Sequelize, type Model, type Optional, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface rechargeAttributes {
  id?: number
  amount?: any
  countryId?: number
  currencyId?: number
  bankId?: number
  bank?: number
  capture?: string
  reference?: string
  adminId?: string
  userId?: string
  status?: EStatusRecharge
  reason?: string
  type?: ETypeRecharge
  code?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface rechargeReponseAll {
  total: number
  totalPage: number
  data: rechargeInstance[]
  actualPage: number
  totalAmount?: any
  totalAgain?: any
  totalAmountFilter?: any
  totalAgainFilter?: any
}

interface rechargeCreationAttributes extends Optional<rechargeAttributes, 'id'> {}

export interface rechargeInstance
  extends Model<rechargeAttributes, rechargeCreationAttributes>,
    rechargeAttributes {}

export enum EStatusRecharge {
  APPROVED = 1,
  PENDING = 2,
  DECLINE = 3,
}

export enum ETypeRecharge {
  recharge = 1,
  withDraw = 2,
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
    type: DataTypes.UUID,
    field: 'admin_id',
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
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
  type: {
    type: DataTypes.INTEGER,
    field: 'type',
    allowNull: true,
    defaultValue: 1,
  },
  code: {
    type: DataTypes.STRING,
    field: 'code',
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
    allowNull: true,
    defaultValue: null
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
  recharge.associate = function (models: ModelRegistry) {
    const { modelRecharge, modelBank, modelCurrency, modelUser } = models
    modelRecharge.hasOne(modelBank, {
      sourceKey: 'bankId',
      foreignKey: 'id',
      as: 'usedBank',
    })
    modelRecharge.hasOne(modelCurrency, {
      sourceKey: 'currencyId',
      foreignKey: 'id',
      as: 'currency',
    })
    modelRecharge.hasOne(modelUser, {
      sourceKey: 'userId',
      foreignKey: 'id',
      as: 'user',
    })
    modelRecharge.hasOne(modelUser, {
      sourceKey: 'adminId',
      foreignKey: 'id',
      as: 'admin',
    })
  }
  return recharge
}
