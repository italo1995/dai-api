import { DataTypes, type Model, type Optional, type Sequelize } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IRegionAttributes {
  id: number
  name: string
  countryId: number
  flag?: string
  state: boolean
  phone?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IRegionCreationAttributes extends Optional<IRegionAttributes, 'id'> {}

export interface IRegionInstance
  extends Model<IRegionAttributes, IRegionCreationAttributes>,
    IRegionAttributes {}

export const vRegionModelAttributes: SequelizeAttributes<IRegionAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
  },
  countryId: {
    type: DataTypes.INTEGER,
    field: 'country_id',
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

export function fxRegionFactory(sequelize: Sequelize) {
  const vRegion = <ModelStatic<IRegionInstance>>sequelize.define('Region', vRegionModelAttributes, {
    tableName: 'regions',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vRegion.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vRegion
}
