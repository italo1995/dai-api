import { DataTypes, type Model, type Optional, type Sequelize } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import { v4 as uuidv4 } from 'uuid'

export interface IRegionAttributes {
  id: string
  name: string
  countryId: number
  flag: string
  state: boolean
  createdAt?: Date
  updatedAt?: Date
}
interface IRegionCreationAttributes extends Optional<IRegionAttributes, 'id'> {}

export interface IRegionInstance
  extends Model<IRegionAttributes, IRegionCreationAttributes>,
    IRegionAttributes {}

export const vRegionModelAttributes: SequelizeAttributes<IRegionAttributes> = {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4(),
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

export function fxRegionFactory(sequelize: Sequelize) {
  const vRegion = <ModelStatic<IRegionInstance>>sequelize.define('Region', vRegionModelAttributes, {
    tableName: 'regions',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
  })

  vRegion.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vRegion
}
