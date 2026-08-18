import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IStoreCategoryAttributes {
  id: number
  storeId: number
  name: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IStoreCategoryCreationAttributes extends Optional<IStoreCategoryAttributes, 'id'> {}

export interface IStoreCategoryInstance
  extends Model<IStoreCategoryAttributes, IStoreCategoryCreationAttributes>,
    IStoreCategoryAttributes {}

export const vStoreCategoryModelAttributes: SequelizeAttributes<IStoreCategoryAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  storeId: {
    type: DataTypes.INTEGER,
    field: 'store_id',
    allowNull: false,
    references: {
      model: {
        tableName: 'stores',
      },
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
    allowNull: false,
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

export function fxStoreCategoryFactory(sequelize: Sequelize) {
  const vStoreCategory = <ModelStatic<IStoreCategoryInstance>>sequelize.define(
    'StoreCategory',
    vStoreCategoryModelAttributes,
    {
      tableName: 'store_categories',
      defaultScope: {
        order: [['name', 'ASC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vStoreCategory.associate = function (models: ModelRegistry) {
    const { modelStoreCategory, modelStore } = models
    modelStoreCategory.hasOne(modelStore, {
      sourceKey: 'storeId',
      foreignKey: 'id',
      as: 'store',
    })
  }

  vStoreCategory.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vStoreCategory
}
