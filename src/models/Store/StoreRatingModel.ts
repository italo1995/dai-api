import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IStoreRatingAttributes {
  id: number
  storeId: number
  userId: string
  orderId?: number | null
  rating: number
  comment?: string | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IStoreRatingCreationAttributes extends Optional<IStoreRatingAttributes, 'id'> {}

export interface IStoreRatingInstance
  extends Model<IStoreRatingAttributes, IStoreRatingCreationAttributes>,
    IStoreRatingAttributes {}

export const vStoreRatingModelAttributes: SequelizeAttributes<IStoreRatingAttributes> = {
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
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
    allowNull: false,
    references: {
      model: {
        tableName: 'users',
      },
      key: 'id',
    },
  },
  orderId: {
    type: DataTypes.INTEGER,
    field: 'order_id',
    allowNull: true,
    defaultValue: null,
  },
  rating: {
    type: DataTypes.INTEGER,
    field: 'rating',
    allowNull: false,
    validate: {
      isInt: true,
      min: 1,
      max: 5,
    },
  },
  comment: {
    type: DataTypes.STRING,
    field: 'comment',
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

export function fxStoreRatingFactory(sequelize: Sequelize) {
  const vStoreRating = <ModelStatic<IStoreRatingInstance>>sequelize.define(
    'StoreRating',
    vStoreRatingModelAttributes,
    {
      tableName: 'store_ratings',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vStoreRating.associate = function (models: ModelRegistry) {
    const { modelStoreRating, modelUser } = models
    modelStoreRating.hasOne(modelUser, {
      sourceKey: 'userId',
      foreignKey: 'id',
      as: 'user',
    })
  }

  vStoreRating.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vStoreRating
}
