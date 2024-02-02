import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface INewAttributes {
  id: string
  name: string
  image: string
  description: string
  state?: boolean
  isFeatured?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface INewCreationAttrinutes extends Optional<INewAttributes, 'id'> {}

export interface INewInstance
  extends Model<INewAttributes, INewCreationAttrinutes>,
    INewAttributes {}

export const vNewAttributes: SequelizeAttributes<INewAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
  },
  image: {
    type: DataTypes.STRING,
    field: 'image',
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description',
  },
  state: {
    type: DataTypes.BOOLEAN,
    field: 'status',
    defaultValue: true,
    allowNull: true,
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    field: 'is_featured',
    defaultValue: true,
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
    allowNull: false,
  },
}

export function fxNewFactory(sequelize: Sequelize) {
  const vNew = <ModelStatic<INewInstance>>sequelize.define(
    'new',
    vNewAttributes,
    {
      tableName: 'news',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vNew.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vNew
}
