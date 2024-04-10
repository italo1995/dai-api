import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IReviewAttributes {
  id: number
  clientId?: string
  driverId?: string
  qualification: number
  comment: string
  features?: boolean
  tripId?: number
  type?: ETypeReview
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
export enum ETypeReview {
  'DRIVER' = 2,
  'PASSENGER' = 1,
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
    type: DataTypes.UUID,
    field: 'client_id',
    allowNull: true,
    defaultValue: null,
  },
  driverId: {
    type: DataTypes.UUID,
    field: 'driver_id',
    allowNull: true,
    defaultValue: null,
  },
  qualification: {
    type: DataTypes.FLOAT,
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
    type: DataTypes.BOOLEAN,
    field: 'features',
    defaultValue: false,
    allowNull: true,
  },
  tripId: {
    type: DataTypes.INTEGER,
    field: 'trip_id',
    defaultValue: null,
    allowNull: true,
  },
  type: {
    type: DataTypes.INTEGER,
    field: 'type',
    allowNull: true,
    defaultValue: 1,
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

export function fxReviewFactory(sequelize: Sequelize) {
  const vReview = <ModelStatic<IReviewInstance>>sequelize.define('Review', vReviewAttributes, {
    tableName: 'reviews',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })
  vReview.associate = function (models: ModelRegistry) {
    const { modelReview, modelUser } = models
    modelReview.hasOne(modelUser, {
      sourceKey: 'driverId',
      foreignKey: 'id',
      as: 'driver',
    })
    modelReview.hasOne(modelUser, {
      sourceKey: 'clientId',
      foreignKey: 'id',
      as: 'client',
    })
  }
  vReview.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vReview
}
