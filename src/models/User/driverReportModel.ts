import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IDriverReportAttributes {
  id: string
  userId: string
  ammount: number
  quantity: number
  createdAt?: Date
  updatedAt?: Date
}
interface IDriverReportCreationAttributes extends Optional<IDriverReportAttributes, 'id'> {}

export interface IDriverReportInstance
  extends Model<IDriverReportAttributes, IDriverReportCreationAttributes>,
    IDriverReportAttributes {}

export const vDriverReportModelAttributes: SequelizeAttributes<IDriverReportAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.STRING,
    field: 'user_id',
  },
  ammount: {
    type: DataTypes.FLOAT,
    field: 'ammount',
    defaultValue: null,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    field: 'quantity',
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
}

export function fxDriverReportFactory(sequelize: Sequelize) {
  const vDriverReport = <ModelStatic<IDriverReportInstance>>sequelize.define(
    'DriverReport',
    vDriverReportModelAttributes,
    {
      tableName: 'driver_report',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  vDriverReport.prototype.toJSON = function () {
    const values = { ...this.get() }
    return values
  }
  return vDriverReport
}
