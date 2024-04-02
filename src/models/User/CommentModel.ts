import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import { type ModelRegistry } from '..'
export interface ICommentAttributes {
  id: string
  userId: string
  name: string
  description: string
  parentId: string
  serviceId: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface ICommentCreationAttributes extends Optional<ICommentAttributes, 'id'> {}

export interface ICommentInstance
  extends Model<ICommentAttributes, ICommentCreationAttributes>,
    ICommentAttributes {}

export const vCommentAttributes: SequelizeAttributes<ICommentAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
    defaultValue: null,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    field: 'description',
  },
  parentId: {
    type: DataTypes.INTEGER,
    field: 'parent_id',
  },
  serviceId: {
    type: DataTypes.STRING,
    field: 'service_id',
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

export function fxCommentFactory(sequelize: Sequelize) {
  const vDataBase = <ModelStatic<ICommentInstance>>sequelize.define('Comment', vCommentAttributes, {
    tableName: 'comments',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vDataBase.associate = function (models: ModelRegistry) {
    const { modelComment, modelUser } = models

    modelComment.hasMany(modelComment, {
      foreignKey: 'parentId',
      as: 'children',
    })
    modelUser.hasMany(modelComment, {
      foreignKey: 'userId',
      as: 'comments',
    })
    modelComment.hasOne(modelUser, {
      sourceKey: 'userId',
      foreignKey: 'id',
      as: 'user',
    })
  }

  vDataBase.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vDataBase
}
