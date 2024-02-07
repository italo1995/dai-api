import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import { v4 as uuidv4 } from 'uuid'

export interface ICityAttributes {
  id: string
  name: string
  regionId: number
  flag: string
  state: boolean
  createdAt?: Date
  updatedAt?: Date
}
interface ICityCreationAttributes extends Optional<ICityAttributes, 'id'> {}

export interface ICityInstance
  extends Model<ICityAttributes, ICityCreationAttributes>,
    ICityAttributes {}

export const vCityModelAttributes: SequelizeAttributes<ICityAttributes> = {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4(),
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

export function fxCityFactory(sequelize: Sequelize) {
  const ICity = <ModelStatic<ICityInstance>>sequelize.define('City', vCityModelAttributes, {
    tableName: 'cities',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
  })

  ICity.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return ICity
}
