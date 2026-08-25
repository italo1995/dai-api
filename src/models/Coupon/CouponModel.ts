import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export enum ECouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export interface ICouponAttributes {
  id: number
  code: string
  type: ECouponType
  value: number
  minOrderAmount?: number | null
  maxDiscount?: number | null
  usageLimit?: number | null
  usageCount?: number
  expiresAt?: Date | null
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface ICouponCreationAttributes extends Optional<ICouponAttributes, 'id'> {}

export interface ICouponInstance
  extends Model<ICouponAttributes, ICouponCreationAttributes>,
    ICouponAttributes {}

export const vCouponModelAttributes: SequelizeAttributes<ICouponAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING,
    field: 'code',
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.STRING,
    field: 'type',
    allowNull: false,
  },
  value: {
    type: DataTypes.DOUBLE,
    field: 'value',
    allowNull: false,
  },
  minOrderAmount: {
    type: DataTypes.DOUBLE,
    field: 'min_order_amount',
    allowNull: true,
    defaultValue: null,
  },
  maxDiscount: {
    type: DataTypes.DOUBLE,
    field: 'max_discount',
    allowNull: true,
    defaultValue: null,
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    field: 'usage_limit',
    allowNull: true,
    defaultValue: null,
  },
  usageCount: {
    type: DataTypes.INTEGER,
    field: 'usage_count',
    allowNull: false,
    defaultValue: 0,
  },
  expiresAt: {
    type: DataTypes.DATE,
    field: 'expires_at',
    allowNull: true,
    defaultValue: null,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    field: 'is_active',
    allowNull: false,
    defaultValue: true,
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
    defaultValue: null,
  },
}

export function fxCouponFactory(sequelize: Sequelize) {
  const vCoupon = <ModelStatic<ICouponInstance>>sequelize.define('Coupon', vCouponModelAttributes, {
    tableName: 'coupons',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vCoupon.associate = function (_models: ModelRegistry) {
    // sin asociaciones propias - Cart lo referencia por couponId (ver CartModel)
  }

  vCoupon.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vCoupon
}
