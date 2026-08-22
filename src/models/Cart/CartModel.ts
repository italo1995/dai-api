import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface ICartAttributes {
  id: number
  userId: string
  storeId?: number | null
  createdAt?: Date
  updatedAt?: Date
}
interface ICartCreationAttributes extends Optional<ICartAttributes, 'id'> {}

export interface ICartInstance
  extends Model<ICartAttributes, ICartCreationAttributes>,
    ICartAttributes {}

export const vCartModelAttributes: SequelizeAttributes<ICartAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
    allowNull: false,
    unique: true,
    references: {
      model: {
        tableName: 'users',
      },
      key: 'id',
    },
  },
  storeId: {
    type: DataTypes.INTEGER,
    field: 'store_id',
    allowNull: true,
    defaultValue: null,
    references: {
      model: {
        tableName: 'stores',
      },
      key: 'id',
    },
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

export function fxCartFactory(sequelize: Sequelize) {
  const vCart = <ModelStatic<ICartInstance>>sequelize.define('Cart', vCartModelAttributes, {
    tableName: 'carts',
    freezeTableName: true,
    timestamps: true,
  })

  vCart.associate = function (models: ModelRegistry) {
    const { modelCart, modelCartItem, modelStore } = models
    modelCart.hasMany(modelCartItem, {
      sourceKey: 'id',
      foreignKey: 'cartId',
      as: 'items',
    })
    modelCart.hasOne(modelStore, {
      sourceKey: 'storeId',
      foreignKey: 'id',
      as: 'store',
    })
  }

  vCart.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vCart
}
