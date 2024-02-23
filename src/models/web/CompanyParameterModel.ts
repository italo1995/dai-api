import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ICompanyParameterAttributes {
  id: number
  name: string
  value: number
  type?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface ICompanyParameterCreationAttributes extends Optional<ICompanyParameterAttributes, 'id'> {}

export interface ICompanyParameterInstance
  extends Model<ICompanyParameterAttributes, ICompanyParameterCreationAttributes>,
    ICompanyParameterAttributes {}

export const vRangePriceModelAttributes: SequelizeAttributes<ICompanyParameterAttributes> = {
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
  value: {
    type: DataTypes.INTEGER,
    field: 'value',
  },
  type: {
    type: DataTypes.ENUM,
    field: 'type',
    allowNull: true,
    defaultValue: null
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

export function fxCompanyParameterFactory(sequelize: Sequelize) {
  const vDateBase = <ModelStatic<ICompanyParameterInstance>>sequelize.define(
    'CompanyParameter',
    vRangePriceModelAttributes,
    {
      tableName: 'company_parameters',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true
    }
  )

  vDateBase.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vDateBase
}
