import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface ICartItemModifierAttributes {
  id: number
  cartItemId: number
  modifierId: number
  createdAt?: Date
  updatedAt?: Date
}
interface ICartItemModifierCreationAttributes extends Optional<ICartItemModifierAttributes, 'id'> {}

export interface ICartItemModifierInstance
  extends Model<ICartItemModifierAttributes, ICartItemModifierCreationAttributes>,
    ICartItemModifierAttributes {}

export const vCartItemModifierModelAttributes: SequelizeAttributes<ICartItemModifierAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  cartItemId: {
    type: DataTypes.INTEGER,
    field: 'cart_item_id',
    allowNull: false,
    references: {
      model: {
        tableName: 'cart_items',
      },
      key: 'id',
    },
  },
  modifierId: {
    type: DataTypes.INTEGER,
    field: 'modifier_id',
    allowNull: false,
    references: {
      model: {
        tableName: 'store_product_modifiers',
      },
      key: 'id',
    },
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

export function fxCartItemModifierFactory(sequelize: Sequelize) {
  const vCartItemModifier = <ModelStatic<ICartItemModifierInstance>>(
    sequelize.define('CartItemModifier', vCartItemModifierModelAttributes, {
      tableName: 'cart_item_modifiers',
      freezeTableName: true,
      timestamps: true,
    })
  )

  vCartItemModifier.associate = function (models: ModelRegistry) {
    const { modelCartItemModifier, modelStoreProductModifier } = models
    modelCartItemModifier.hasOne(modelStoreProductModifier, {
      sourceKey: 'modifierId',
      foreignKey: 'id',
      as: 'modifier',
    })
  }

  vCartItemModifier.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vCartItemModifier
}
