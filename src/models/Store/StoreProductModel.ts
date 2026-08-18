import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IStoreProductAttributes {
  id: number
  storeId: number
  name: string
  description?: string | null
  price: number
  currencyId?: number | null
  image?: string | null
  departmentId?: number | null
  isAvailable?: boolean
  isInventoryable?: boolean
  stockQuantity?: number | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IStoreProductCreationAttributes extends Optional<IStoreProductAttributes, 'id'> {}

export interface IStoreProductInstance
  extends Model<IStoreProductAttributes, IStoreProductCreationAttributes>,
    IStoreProductAttributes {}

export const vStoreProductModelAttributes: SequelizeAttributes<IStoreProductAttributes> = {
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
  description: {
    type: DataTypes.TEXT,
    field: 'description',
    allowNull: true,
    defaultValue: null,
  },
  price: {
    type: DataTypes.DOUBLE,
    field: 'price',
    allowNull: false,
    defaultValue: 0,
  },
  currencyId: {
    type: DataTypes.INTEGER,
    field: 'currency_id',
    allowNull: true,
    references: {
      model: {
        tableName: 'currencies',
      },
      key: 'id',
    },
  },
  image: {
    type: DataTypes.STRING,
    field: 'image',
    allowNull: true,
    defaultValue: null,
  },
  departmentId: {
    type: DataTypes.INTEGER,
    field: 'department_id',
    allowNull: true,
    defaultValue: null,
    references: {
      model: {
        tableName: 'store_departments',
      },
      key: 'id',
    },
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    field: 'is_available',
    allowNull: true,
    defaultValue: true,
  },
  isInventoryable: {
    type: DataTypes.BOOLEAN,
    field: 'is_inventoryable',
    allowNull: true,
    defaultValue: false,
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    field: 'stock_quantity',
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

export function fxStoreProductFactory(sequelize: Sequelize) {
  const vStoreProduct = <ModelStatic<IStoreProductInstance>>sequelize.define(
    'StoreProduct',
    vStoreProductModelAttributes,
    {
      tableName: 'store_products',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vStoreProduct.associate = function (models: ModelRegistry) {
    const { modelStoreProduct, modelStore, modelCurrency, modelStoreDepartment, modelStoreCategory, modelStoreProductCategory } = models
    modelStoreProduct.hasOne(modelStore, {
      sourceKey: 'storeId',
      foreignKey: 'id',
      as: 'store',
    })
    modelStoreProduct.hasOne(modelCurrency, {
      sourceKey: 'currencyId',
      foreignKey: 'id',
      as: 'currency',
    })
    modelStoreProduct.hasOne(modelStoreDepartment, {
      sourceKey: 'departmentId',
      foreignKey: 'id',
      as: 'department',
    })
    modelStoreProduct.belongsToMany(modelStoreCategory, {
      through: modelStoreProductCategory,
      foreignKey: 'productId',
      otherKey: 'categoryId',
      as: 'categories',
    })
  }

  vStoreProduct.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vStoreProduct
}
