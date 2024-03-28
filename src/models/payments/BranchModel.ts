import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IBranchAttributes {
  id: string
  name: string
  number: string
  email?: string
  direction: string
  lat?: string
  lon?: string
  image?: string
  referencePoint?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IBranchCreationAttributes extends Optional<IBranchAttributes, 'id'> {}

export interface IBranchInstance
  extends Model<IBranchAttributes, IBranchCreationAttributes>,
    IBranchAttributes {}

export const vBranchAttributes: SequelizeAttributes<IBranchAttributes> = {
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
  number: {
    type: DataTypes.STRING,
    field: 'number',
  },
  email: {
    type: DataTypes.STRING,
    field: 'email',
    allowNull: true,
    defaultValue: null,
  },
  direction: {
    type: DataTypes.STRING,
    field: 'direction',
  },
  lat: {
    type: DataTypes.STRING,
    field: 'lat',
    allowNull: true,
    defaultValue: null,
  },
  lon: {
    type: DataTypes.STRING,
    field: 'lon',
    allowNull: true,
    defaultValue: null
  },
  image: {
    type: DataTypes.STRING,
    field: 'image',
    defaultValue: null,
    allowNull: true,
  },
  referencePoint: {
    type: DataTypes.STRING,
    field: 'reference_point',
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
    defaultValue: null,
    allowNull: true,
  },
}

export function fxBranchFactory(sequelize: Sequelize) {
  const vBranch = <ModelStatic<IBranchInstance>>sequelize.define('Branch', vBranchAttributes, {
    tableName: 'branches',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vBranch.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vBranch
}
