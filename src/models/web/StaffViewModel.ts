import { type Sequelize, type Model, type Optional, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface staffViewAttributes {
  id?: number
  staffId?: number
  viewId?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface staffViewReponseAll {
  total: number
  totalPage: number
  data: staffViewInstance[]
  actualPage: number
}

interface staffViewCreationAttributes extends Optional<staffViewAttributes, 'id'> {}

export interface staffViewInstance
  extends Model<staffViewAttributes, staffViewCreationAttributes>,
    staffViewAttributes {}

export const staffViewModelAttributes: SequelizeAttributes<staffViewAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  staffId: {
    type: DataTypes.INTEGER,
    field: 'staff_id',
  },
  viewId: {
    type: DataTypes.STRING,
    field: 'view_id',
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
}

export function fxStaffViewFactory(sequelize: Sequelize) {
  const staffView = <ModelStatic<staffViewInstance>>sequelize.define(
    'staffView',
    staffViewModelAttributes,
    {
      tableName: 'staff_views',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  return staffView
}
