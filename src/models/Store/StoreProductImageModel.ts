import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IStoreProductImageAttributes {
  id: number
  productId: number
  image: string
  order: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IStoreProductImageCreationAttributes
  extends Optional<IStoreProductImageAttributes, 'id'> {}

export interface IStoreProductImageInstance
  extends Model<IStoreProductImageAttributes, IStoreProductImageCreationAttributes>,
    IStoreProductImageAttributes {}

export const vStoreProductImageModelAttributes: SequelizeAttributes<IStoreProductImageAttributes> = {
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
  image: {
    type: DataTypes.STRING,
    field: 'image',
    allowNull: false,
  },
  order: {
    type: DataTypes.INTEGER,
    field: 'order',
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

export function fxStoreProductImageFactory(sequelize: Sequelize) {
  const vStoreProductImage = <ModelStatic<IStoreProductImageInstance>>sequelize.define(
    'StoreProductImage',
    vStoreProductImageModelAttributes,
    {
      tableName: 'store_product_images',
      defaultScope: {
        order: [['order', 'ASC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vStoreProductImage.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vStoreProductImage
}
