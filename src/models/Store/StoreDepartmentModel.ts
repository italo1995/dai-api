import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IStoreDepartmentAttributes {
  id: number
  storeId: number
  name: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IStoreDepartmentCreationAttributes extends Optional<IStoreDepartmentAttributes, 'id'> {}

export interface IStoreDepartmentInstance
  extends Model<IStoreDepartmentAttributes, IStoreDepartmentCreationAttributes>,
    IStoreDepartmentAttributes {}

export const vStoreDepartmentModelAttributes: SequelizeAttributes<IStoreDepartmentAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  storeId: {
    type: DataTypes.INTEGER,
    field: 'store_id',
    allowNull: false,
    references: {
      model: {
        tableName: 'stores',
      },
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
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

export function fxStoreDepartmentFactory(sequelize: Sequelize) {
  const vStoreDepartment = <ModelStatic<IStoreDepartmentInstance>>sequelize.define(
    'StoreDepartment',
    vStoreDepartmentModelAttributes,
    {
      tableName: 'store_departments',
      defaultScope: {
        order: [['name', 'ASC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vStoreDepartment.associate = function (models: ModelRegistry) {
    const { modelStoreDepartment, modelStore } = models
    modelStoreDepartment.hasOne(modelStore, {
      sourceKey: 'storeId',
      foreignKey: 'id',
      as: 'store',
    })
  }

  vStoreDepartment.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vStoreDepartment
}
