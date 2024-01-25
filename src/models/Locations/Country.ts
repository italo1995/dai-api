import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ICountryAttributes {
  id: number
  name: string
  flag?: string
  state: boolean
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
  state: {
    type: DataTypes.BOOLEAN,
    field: 'state',
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
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
