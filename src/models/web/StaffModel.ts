import { type Sequelize, type Model, type Optional, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IStaffAttributes {
  id?: number
  name?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

export interface staffReponseAll {
  total: number
  totalPage: number
  data: staffInstance[]
  actualPage: number
}

interface staffCreationAttributes extends Optional<IStaffAttributes, 'id'> {}

export interface staffInstance
  extends Model<IStaffAttributes, staffCreationAttributes>,
    IStaffAttributes {}

export const staffModelAttributes: SequelizeAttributes<IStaffAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
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

export function fxStaffFactory(sequelize: Sequelize) {
  const staff = <ModelStatic<staffInstance>>sequelize.define('staff', staffModelAttributes, {
    tableName: 'staff',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })
  staff.associate = function (models: ModelRegistry) {
    const { modelStaff, modelStaffView, modelView } = models
    modelStaff.belongsToMany(modelView, {
      through: modelStaffView,
      foreignKey: 'staffId',
      otherKey: 'viewId',
      as: 'views',
    })
  }
  return staff
}
