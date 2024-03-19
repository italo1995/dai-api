import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ICarDataAttributes {
  id: string
  name: string
  icon: string
  type: ETypeCarData
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface ICarDataCreationAttributes extends Optional<ICarDataAttributes, 'id'> {}

export interface ICarDataInstance
  extends Model<ICarDataAttributes, ICarDataCreationAttributes>,
    ICarDataAttributes {}

export enum ETypeCarData {
  year = 1,
  model = 2,
  color = 3,
  brand = 4
}
export const vCarDataAttributes: SequelizeAttributes<ICarDataAttributes> = {
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
  icon: {
    type: DataTypes.STRING,
    field: 'icon'
  },
  type: {
    type: DataTypes.INTEGER,
    field: 'type',
    allowNull: false
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
    allowNull: true,
    defaultValue: null
  },
}

export function fxCarDataFactory(sequelize: Sequelize) {
  const vDataBase = <ModelStatic<ICarDataInstance>>sequelize.define(
    'CarData',
    vCarDataAttributes,
    {
      tableName: 'car_data',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vDataBase.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vDataBase
}
