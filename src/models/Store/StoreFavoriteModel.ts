import { type Sequelize, type Model, type Optional, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IStoreFavoriteAttributes {
  id?: number
  userId: string
  storeId: number
  createdAt?: Date
  updatedAt?: Date
}
interface IStoreFavoriteCreationAttributes extends Optional<IStoreFavoriteAttributes, 'id'> {}

export interface IStoreFavoriteInstance
  extends Model<IStoreFavoriteAttributes, IStoreFavoriteCreationAttributes>,
    IStoreFavoriteAttributes {}

export const vStoreFavoriteModelAttributes: SequelizeAttributes<IStoreFavoriteAttributes> = {
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
  },
  storeId: {
    type: DataTypes.INTEGER,
    field: 'store_id',
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
}

export function fxStoreFavoriteFactory(sequelize: Sequelize) {
  const vStoreFavorite = <ModelStatic<IStoreFavoriteInstance>>sequelize.define(
    'StoreFavorite',
    vStoreFavoriteModelAttributes,
    {
      tableName: 'store_favorites',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  vStoreFavorite.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vStoreFavorite
}
