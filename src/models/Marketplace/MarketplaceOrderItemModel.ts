import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

// Espejo de cart_items, pero CONGELADO: unitPrice/subtotal/nombre de modificadores quedan
// guardados tal cual estaban al momento de crear el pedido (tarea 2/8 del desglose de Orden),
// no se recalculan si el producto cambia de precio despues. productId se deja como referencia
// informativa (para poder mostrar imagen/link al producto actual), pero el precio real de este
// item SIEMPRE es unitPrice, nunca el precio en vivo del producto.
export interface IMarketplaceOrderItemAttributes {
  id: number
  orderId: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
  notes?: string | null
  createdAt?: Date
  updatedAt?: Date
}
interface IMarketplaceOrderItemCreationAttributes extends Optional<IMarketplaceOrderItemAttributes, 'id'> {}

export interface IMarketplaceOrderItemInstance
  extends Model<IMarketplaceOrderItemAttributes, IMarketplaceOrderItemCreationAttributes>,
    IMarketplaceOrderItemAttributes {}

export const vMarketplaceOrderItemModelAttributes: SequelizeAttributes<IMarketplaceOrderItemAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    field: 'order_id',
    allowNull: false,
    references: {
      model: { tableName: 'marketplace_orders' },
      key: 'id',
    },
  },
  productId: {
    type: DataTypes.INTEGER,
    field: 'product_id',
    allowNull: false,
    references: {
      model: { tableName: 'store_products' },
      key: 'id',
    },
  },
  // Nombre del producto al momento de la compra, congelado - si el comercio renombra o borra
  // el producto despues, el pedido historico sigue siendo legible.
  productName: {
    type: DataTypes.STRING,
    field: 'product_name',
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    field: 'quantity',
    allowNull: false,
    defaultValue: 1,
  },
  // Precio unitario YA con modificadores incluidos (mismo calculo que CartService.show() hace
  // en vivo - unitPrice = precio final del producto + suma de modificadores elegidos).
  unitPrice: {
    type: DataTypes.DOUBLE,
    field: 'unit_price',
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DOUBLE,
    field: 'subtotal',
    allowNull: false,
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

export function fxMarketplaceOrderItemFactory(sequelize: Sequelize) {
  const vMarketplaceOrderItem = <ModelStatic<IMarketplaceOrderItemInstance>>sequelize.define(
    'MarketplaceOrderItem',
    vMarketplaceOrderItemModelAttributes,
    {
      tableName: 'marketplace_order_items',
      defaultScope: {
        order: [['id', 'ASC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  vMarketplaceOrderItem.associate = function (models: ModelRegistry) {
    const { modelMarketplaceOrderItem, modelMarketplaceOrderItemModifier, modelStoreProduct } = models
    modelMarketplaceOrderItem.hasMany(modelMarketplaceOrderItemModifier, {
      sourceKey: 'id',
      foreignKey: 'orderItemId',
      as: 'modifiers',
    })
    modelMarketplaceOrderItem.hasOne(modelStoreProduct, {
      sourceKey: 'productId',
      foreignKey: 'id',
      as: 'product',
    })
  }

  vMarketplaceOrderItem.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vMarketplaceOrderItem
}
