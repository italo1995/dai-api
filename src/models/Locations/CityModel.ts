import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ICityAttributes {
  id: number
  name: string
  regionId: number
  flag?: string
  state: boolean
  phone?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface ICityCreationAttributes extends Optional<ICityAttributes, 'id'> {}

export interface ICityInstance
  extends Model<ICityAttributes, ICityCreationAttributes>,
    ICityAttributes {}

export const vCityModelAttributes: SequelizeAttributes<ICityAttributes> = {
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
  regionId: {
    type: DataTypes.INTEGER,
    field: 'region_id',
  },
  flag: {
    type: DataTypes.STRING,
    field: 'flag',
  },
  state: {
    type: DataTypes.BOOLEAN,
    field: 'state',
  },
  phone: {
    type: DataTypes.STRING,
    field: 'phone',
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

export function fxCityFactory(sequelize: Sequelize) {
  const ICity = <ModelStatic<ICityInstance>>sequelize.define('City', vCityModelAttributes, {
    tableName: 'cities',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  ICity.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return ICity
}
