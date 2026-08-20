import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IStoreProductModifierGroupAttributes {
  id: number
  productId: number
  name: string
  required: boolean
  minSelections: number
  maxSelections?: number | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IStoreProductModifierGroupCreationAttributes
  extends Optional<IStoreProductModifierGroupAttributes, 'id'> {}

export interface IStoreProductModifierGroupInstance
  extends Model<IStoreProductModifierGroupAttributes, IStoreProductModifierGroupCreationAttributes>,
    IStoreProductModifierGroupAttributes {}

export const vStoreProductModifierGroupModelAttributes: SequelizeAttributes<IStoreProductModifierGroupAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
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
  name: {
    type: DataTypes.STRING,
    field: 'name',
    allowNull: false,
  },
  required: {
    type: DataTypes.BOOLEAN,
    field: 'required',
    allowNull: false,
    defaultValue: false,
  },
  minSelections: {
    type: DataTypes.INTEGER,
    field: 'min_selections',
    allowNull: false,
    defaultValue: 0,
  },
  maxSelections: {
    type: DataTypes.INTEGER,
    field: 'max_selections',
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
    defaultValue: null,
  },
}

export function fxStoreProductModifierGroupFactory(sequelize: Sequelize) {
  const vStoreProductModifierGroup = <ModelStatic<IStoreProductModifierGroupInstance>>sequelize.define(
    'StoreProductModifierGroup',
    vStoreProductModifierGroupModelAttributes,
    {
      tableName: 'store_product_modifier_groups',
      defaultScope: {
        order: [['id', 'ASC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vStoreProductModifierGroup.associate = function (models: ModelRegistry) {
    const { modelStoreProductModifierGroup, modelStoreProductModifier } = models
    modelStoreProductModifierGroup.hasMany(modelStoreProductModifier, {
      sourceKey: 'id',
      foreignKey: 'groupId',
      as: 'modifiers',
    })
  }

  vStoreProductModifierGroup.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vStoreProductModifierGroup
}
