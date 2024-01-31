import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../types/SequelizeTypes'

export interface IReviewAttributes {
  id: number
  clientId: number
  driverId: number
  qualification: string
  comment: string
  features?: string
  createdAt?: Date
  updatedAt?: Date
}
interface IReviewCreationAttributes extends Optional<IReviewAttributes, 'id'> {}

export interface IReviewInstance
  extends Model<IReviewAttributes, IReviewCreationAttributes>,
    IReviewAttributes {}

export const vReviewAttributes: SequelizeAttributes<IReviewAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  clientId: {
    type: DataTypes.INTEGER,
    field: 'client_Id',
  },
  driverId: {
    type: DataTypes.INTEGER,
    field: 'driver_Id',
  },
  qualification: {
    type: DataTypes.INTEGER,
    field: 'qualification',
    validate: {
      isInt: true,
      min: 1,
      max: 5,
    },
  },
  comment: {
    type: DataTypes.STRING,
    field: 'coment',
  },
  features: {
    type: DataTypes.STRING,
    field: 'features',
    defaultValue: false,
    allowNUll: true,
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

export function fxReviewFactory(sequelize: Sequelize) {
  const vReview = <ModelStatic<IReviewInstance>>sequelize.define('Review', vReviewAttributes, {
    tableName: 'review',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamp: true,
  })

  vReview.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vReview
}
