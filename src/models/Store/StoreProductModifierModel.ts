import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IStoreProductModifierAttributes {
  id: number
  groupId: number
  name: string
  extraPrice: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IStoreProductModifierCreationAttributes
  extends Optional<IStoreProductModifierAttributes, 'id'> {}

export interface IStoreProductModifierInstance
  extends Model<IStoreProductModifierAttributes, IStoreProductModifierCreationAttributes>,
    IStoreProductModifierAttributes {}

export const vStoreProductModifierModelAttributes: SequelizeAttributes<IStoreProductModifierAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  groupId: {
    type: DataTypes.INTEGER,
    field: 'group_id',
    allowNull: false,
    references: {
      model: {
        tableName: 'store_product_modifier_groups',
      },
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

export function fxStoreProductModifierFactory(sequelize: Sequelize) {
  const vStoreProductModifier = <ModelStatic<IStoreProductModifierInstance>>sequelize.define(
    'StoreProductModifier',
    vStoreProductModifierModelAttributes,
    {
      tableName: 'store_product_modifiers',
      defaultScope: {
        order: [['id', 'ASC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vStoreProductModifier.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vStoreProductModifier
}
