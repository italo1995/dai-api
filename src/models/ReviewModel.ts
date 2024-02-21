import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../types/SequelizeTypes'


export interface IReviewAttributes {
  id: number
  clientId?: number
  driverId?: number
  qualification: number
  comment: string
  features?: string
  tripId?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
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
    allowNull: true,
    defaultValue: null
  },
  driverId: {
    type: DataTypes.INTEGER,
    field: 'driver_Id',
    allowNull: true,
    defaultValue: null
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
    allowNull: true,
  },
  tripId: {
    type: DataTypes.STRING,
    field: 'trip_id',
    defaultValue: null,
    allowNull: true,
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
    defaultValue: null
  }
}

export function fxReviewFactory(sequelize: Sequelize) {
  const vReview = <ModelStatic<IReviewInstance>>sequelize.define('Review', vReviewAttributes, {
    tableName: 'reviews',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true
  })

  vReview.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vReview
}
