import { type Sequelize, type Model, type Optional, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IStoreProductCategoryAttributes {
  id?: number
  productId?: number
  categoryId?: number
  createdAt?: Date
  updatedAt?: Date
}
interface IStoreProductCategoryCreationAttributes
  extends Optional<IStoreProductCategoryAttributes, 'id'> {}

export interface IStoreProductCategoryInstance
  extends Model<IStoreProductCategoryAttributes, IStoreProductCategoryCreationAttributes>,
    IStoreProductCategoryAttributes {}

export const vStoreProductCategoryModelAttributes: SequelizeAttributes<IStoreProductCategoryAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    field: 'product_id',
  },
  categoryId: {
    type: DataTypes.INTEGER,
    field: 'category_id',
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

export function fxStoreProductCategoryFactory(sequelize: Sequelize) {
  const vStoreProductCategory = <ModelStatic<IStoreProductCategoryInstance>>sequelize.define(
    'StoreProductCategory',
    vStoreProductCategoryModelAttributes,
    {
      tableName: 'store_product_categories',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )
  vStoreProductCategory.associate = function (models: ModelRegistry) {
    const { modelStoreProductCategory, modelStoreCategory } = models
    modelStoreProductCategory.belongsTo(modelStoreCategory, {
      foreignKey: 'categoryId',
      targetKey: 'id',
      as: 'category',
    })
  }
  return vStoreProductCategory
}
