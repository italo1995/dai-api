import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export enum ECouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

// A que monto pega el descuento cuando el cupon se aplique a una orden (modulo futuro): al total
// de la compra (productos) o al costo del delivery. Por ahora es solo un dato del cupon - la
// logica que realmente descuenta del delivery se construye junto con el modulo de Orden.
export enum ECouponAppliesTo {
  PURCHASE = 'purchase',
  DELIVERY = 'delivery',
}

export interface ICouponAttributes {
  id: number
  code: string
  type: ECouponType
  value: number
  appliesTo?: ECouponAppliesTo
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
    // unicidad real la impone el indice parcial `coupons_code_unique_active`
    // (ver migracion 20260826200000) - excluye filas soft-deleted para permitir
    // reusar un codigo despues de borrar el cupon que lo tenia.
    type: DataTypes.STRING,
    field: 'code',
    allowNull: false,
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
  appliesTo: {
    type: DataTypes.STRING,
    field: 'applies_to',
    allowNull: false,
    defaultValue: ECouponAppliesTo.PURCHASE,
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
