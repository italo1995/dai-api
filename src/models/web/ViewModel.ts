import { type Sequelize, type Model, type Optional, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IViewAttributes {
  id?: number
  icon?: string
  title?: string
  url?: string
  route?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface ViewReponseAll {
  total: number
  totalPage: number
  data: ViewInstance[]
  actualPage: number
}

interface ViewCreationAttributes extends Optional<IViewAttributes, 'id'> {}

export interface ViewInstance
  extends Model<IViewAttributes, ViewCreationAttributes>,
    IViewAttributes {}

export const ViewModelAttributes: SequelizeAttributes<IViewAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  icon: {
    type: DataTypes.STRING,
    field: 'icon',
    allowNull: true,
    defaultValue: null,
  },
  title: {
    type: DataTypes.STRING,
    field: 'title',
    allowNull: true,
    defaultValue: null,
  },
  url: {
    type: DataTypes.STRING,
    field: 'url',
    allowNull: true,
    defaultValue: null,
  },
  route: {
    type: DataTypes.STRING,
    field: 'route',
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
    defaultValue: null,
    allowNull: true,
  },
}

export function fxViewFactory(sequelize: Sequelize) {
  const View = <ModelStatic<ViewInstance>>sequelize.define('View', ViewModelAttributes, {
    tableName: 'views',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  return View
}
