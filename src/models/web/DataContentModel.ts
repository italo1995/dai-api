import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IDataContentAttributes {
  id: string
  name: string
  description: string
  image?: string
  orden?: number
  type: EDataType
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IDataContentCreationAttributes extends Optional<IDataContentAttributes, 'id'> {}

export interface IDataContentInstance
  extends Model<IDataContentAttributes, IDataContentCreationAttributes>,
    IDataContentAttributes {}

export enum EDataType {
  guide = 1,
  FAQ = 2,
  security = 3,
  us = 4
}

export const vDataContentAttributes: SequelizeAttributes<IDataContentAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
    defaultValue: null,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description',
    defaultValue: null,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING,
    field: 'image',
    defaultValue: null,
    allowNull: true,
  },
  orden: {
    type: DataTypes.INTEGER,
    field: 'orden',
    defaultValue: 0,
    allowNull: true,
  },
  type: {
    type: DataTypes.INTEGER,
    field: 'type',
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
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deletedAt',
    allowNull: true,
    defaultValue: null,
  },
}

export function fxDataContentFactory(sequelize: Sequelize) {
  const vDataBase = <ModelStatic<IDataContentInstance>>sequelize.define(
    'DataContent',
    vDataContentAttributes,
    {
      tableName: 'data_content',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vDataBase.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vDataBase
}
