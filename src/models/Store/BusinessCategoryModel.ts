import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IBusinessCategoryAttributes {
  id: number
  name: string
  type: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IBusinessCategoryCreationAttributes
  extends Optional<IBusinessCategoryAttributes, 'id'> {}

export interface IBusinessCategoryInstance
  extends Model<IBusinessCategoryAttributes, IBusinessCategoryCreationAttributes>,
    IBusinessCategoryAttributes {}

export const vBusinessCategoryModelAttributes: SequelizeAttributes<IBusinessCategoryAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
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

export function fxBusinessCategoryFactory(sequelize: Sequelize) {
  const vBusinessCategory = <ModelStatic<IBusinessCategoryInstance>>sequelize.define(
    'BusinessCategory',
    vBusinessCategoryModelAttributes,
    {
      tableName: 'business_categories',
      defaultScope: {
        order: [['name', 'ASC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vBusinessCategory.associate = function (_models: ModelRegistry) {}

  vBusinessCategory.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vBusinessCategory
}
