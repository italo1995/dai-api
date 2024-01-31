import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IServiceAttributes {
  id: string
  name: string
  image: string
  description: string
  state?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IServiceCreationAttributes extends Optional<IServiceAttributes, 'id'> {}

export interface IServiceInstance
  extends Model<IServiceAttributes, IServiceCreationAttributes>,
    IServiceAttributes {}

export const vServicesAttributes: SequelizeAttributes<IServiceAttributes> = {
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
  image: {
    type: DataTypes.STRING,
    field: 'image',
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description',
  },
  state: {
    type: DataTypes.BOOLEAN,
    field: 'status',
    defaultValue: true,
    alowNull: true,
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
    allowNull: false,
  },
}

export function fxServiceFactory(sequelize: Sequelize) {
  const vService = <ModelStatic<IServiceInstance>>sequelize.define(
    'Service',
    vServicesAttributes,
    {
      tableName: 'service',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vService.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vService
}
