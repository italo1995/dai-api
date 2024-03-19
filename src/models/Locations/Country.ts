import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ICountryAttributes {
  id: number
  name: string
  flag?: string
  phoneCode?: string
  state: boolean
  phone?: string
  createdAt?: Date
  updatedAt?: Date
}
interface ICountryCreationAttributes extends Optional<ICountryAttributes, 'id'> {}

export interface ICountryInstance
  extends Model<ICountryAttributes, ICountryCreationAttributes>,
    ICountryAttributes {}

export const vCountryModelAttributes: SequelizeAttributes<ICountryAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
  },
  flag: {
    type: DataTypes.STRING,
    field: 'flag',
  },
  phoneCode: {
    type: DataTypes.STRING,
    field: 'phone_code',
  },
  state: {
    type: DataTypes.BOOLEAN,
    field: 'state',
  },
  phone: {
    type: DataTypes.STRING,
    field: 'phone',
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
}

export function fxCountryFactory(sequelize: Sequelize) {
  const vCountry = <ModelStatic<ICountryInstance>>sequelize.define(
    'Country',
    vCountryModelAttributes,
    {
      tableName: 'countries',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  vCountry.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vCountry
}
