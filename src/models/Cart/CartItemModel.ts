import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface ICartItemAttributes {
  id: number
  cartId: number
  productId: number
  quantity: number
  notes?: string | null
  createdAt?: Date
  updatedAt?: Date
}
interface ICartItemCreationAttributes extends Optional<ICartItemAttributes, 'id'> {}

export interface ICartItemInstance
  extends Model<ICartItemAttributes, ICartItemCreationAttributes>,
    ICartItemAttributes {}

export const vCartItemModelAttributes: SequelizeAttributes<ICartItemAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  cartId: {
    type: DataTypes.INTEGER,
    field: 'cart_id',
    allowNull: false,
    references: {
      model: {
        tableName: 'carts',
      },
      key: 'id',
    },
  },
  productId: {
    type: DataTypes.INTEGER,
    field: 'product_id',
    allowNull: false,
    references: {
      model: {
        tableName: 'store_products',
      },
      key: 'id',
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    field: 'quantity',
    allowNull: false,
    defaultValue: 1,
  },
  notes: {
    type: DataTypes.STRING,
    field: 'notes',
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
}

export function fxCartItemFactory(sequelize: Sequelize) {
  const vCartItem = <ModelStatic<ICartItemInstance>>sequelize.define('CartItem', vCartItemModelAttributes, {
    tableName: 'cart_items',
    defaultScope: {
      order: [['id', 'ASC']],
    },
    freezeTableName: true,
    timestamps: true,
  })

  vCartItem.associate = function (models: ModelRegistry) {
    const { modelCartItem, modelCartItemModifier, modelStoreProduct } = models
    modelCartItem.hasOne(modelStoreProduct, {
      sourceKey: 'productId',
      foreignKey: 'id',
      as: 'product',
    })
    modelCartItem.hasMany(modelCartItemModifier, {
      sourceKey: 'id',
      foreignKey: 'cartItemId',
      as: 'modifiers',
    })
  }

  vCartItem.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vCartItem
}
