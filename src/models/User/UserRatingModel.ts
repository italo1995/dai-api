import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IUserRatingAttributes {
  id: number
  userId: number
  type: string
  ratings: number
  averageRating: number
  quantity: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IUserRatingCreationAttributes extends Optional<IUserRatingAttributes, 'id'> {}

export interface IUserRatingInstance
  extends Model<IUserRatingAttributes, IUserRatingCreationAttributes>,
    IUserRatingAttributes {}

export const vUserRatingAttributes: SequelizeAttributes<IUserRatingAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id',
  },
  type: {
    type: DataTypes.ENUM('clientID', 'driverID'),
    field: 'type',
  },
  ratings: {
    type: DataTypes.INTEGER,
    field: 'ratings',
    validate: {
      isInt: true,
      min: 1,
      max: 5,
    },
  },
  averageRating:{
    type:DataTypes.NUMBER,
    field: 'average_rating',
  },
  quantity: {
    type: DataTypes.INTEGER,
    field: 'quantity',
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

export function fxUserRatingFactory(sequelize: Sequelize) {
  const vUserRating = <ModelStatic<IUserRatingInstance>>sequelize.define('UserRating', vUserRatingAttributes, {
    tableName: 'user_ratings',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vUserRating.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vUserRating
}
