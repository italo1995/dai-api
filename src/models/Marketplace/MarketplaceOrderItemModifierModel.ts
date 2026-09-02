import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

// A diferencia de cart_item_modifiers (que solo guarda modifierId + quantity, y resuelve
// nombre/precio en vivo via el modelo real), aca se congela name/extraPrice tambien - un
// modificador se puede borrar o cambiar de precio despues de la compra, y el pedido historico
// tiene que seguir mostrando exactamente lo que el cliente pago en su momento.
export interface IMarketplaceOrderItemModifierAttributes {
  id: number
  orderItemId: number
  modifierId: number
  name: string
  extraPrice: number
  quantity: number
  createdAt?: Date
  updatedAt?: Date
}
interface IMarketplaceOrderItemModifierCreationAttributes
  extends Optional<IMarketplaceOrderItemModifierAttributes, 'id'> {}

export interface IMarketplaceOrderItemModifierInstance
  extends Model<IMarketplaceOrderItemModifierAttributes, IMarketplaceOrderItemModifierCreationAttributes>,
    IMarketplaceOrderItemModifierAttributes {}

export const vMarketplaceOrderItemModifierModelAttributes: SequelizeAttributes<IMarketplaceOrderItemModifierAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  orderItemId: {
    type: DataTypes.INTEGER,
    field: 'order_item_id',
    allowNull: false,
    references: {
      model: { tableName: 'marketplace_order_items' },
      key: 'id',
    },
  },
  modifierId: {
    type: DataTypes.INTEGER,
    field: 'modifier_id',
    allowNull: false,
    references: {
      model: { tableName: 'store_product_modifiers' },
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
    allowNull: false,
  },
  extraPrice: {
    type: DataTypes.DOUBLE,
    field: 'extra_price',
    allowNull: false,
    defaultValue: 0,
  },
  quantity: {
    type: DataTypes.INTEGER,
    field: 'quantity',
    allowNull: false,
    defaultValue: 1,
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

export function fxMarketplaceOrderItemModifierFactory(sequelize: Sequelize) {
  const vMarketplaceOrderItemModifier = <ModelStatic<IMarketplaceOrderItemModifierInstance>>(
    sequelize.define('MarketplaceOrderItemModifier', vMarketplaceOrderItemModifierModelAttributes, {
      tableName: 'marketplace_order_item_modifiers',
      freezeTableName: true,
      timestamps: true,
    })
  )

  vMarketplaceOrderItemModifier.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vMarketplaceOrderItemModifier
}
