import { type Sequelize, type Model, type Optional, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IStoreBusinessCategoryAttributes {
  id?: number
  storeId?: number
  businessCategoryId?: number
  createdAt?: Date
  updatedAt?: Date
}
interface IStoreBusinessCategoryCreationAttributes
  extends Optional<IStoreBusinessCategoryAttributes, 'id'> {}

export interface IStoreBusinessCategoryInstance
  extends Model<IStoreBusinessCategoryAttributes, IStoreBusinessCategoryCreationAttributes>,
    IStoreBusinessCategoryAttributes {}

export const vStoreBusinessCategoryModelAttributes: SequelizeAttributes<IStoreBusinessCategoryAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  storeId: {
    type: DataTypes.INTEGER,
    field: 'store_id',
  },
  businessCategoryId: {
    type: DataTypes.INTEGER,
    field: 'business_category_id',
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

export function fxStoreBusinessCategoryFactory(sequelize: Sequelize) {
  const vStoreBusinessCategory = <ModelStatic<IStoreBusinessCategoryInstance>>sequelize.define(
    'StoreBusinessCategory',
    vStoreBusinessCategoryModelAttributes,
    {
      tableName: 'store_business_categories',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )
  vStoreBusinessCategory.associate = function (models: ModelRegistry) {
    const { modelStoreBusinessCategory, modelBusinessCategory } = models
    modelStoreBusinessCategory.belongsTo(modelBusinessCategory, {
      foreignKey: 'businessCategoryId',
      targetKey: 'id',
      as: 'businessCategory',
    })
  }
  return vStoreBusinessCategory
}
