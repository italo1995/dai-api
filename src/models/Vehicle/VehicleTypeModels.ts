import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IVehicleTypeAtributes {
    id: number
    name: string
    isMoto?: boolean
    isCar?: boolean
    createdAt?: Date
    updatedAt?: Date
    deletedAt?: Date
}
interface IVehicleTypeCreationAtributes extends Optional<IVehicleTypeAtributes, 'id'> {}

export interface IVehicleTypeInstance 
  extends Model <IVehicleTypeAtributes, IVehicleTypeCreationAtributes>,
    IVehicleTypeAtributes {}

export const vVehicleTypeModelAttributes: 
SequelizeAttributes<IVehicleTypeAtributes> = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type:DataTypes.STRING,
    field: 'name',
  },
  isMoto: {
    type:DataTypes.BOOLEAN,
    field: 'is_moto',
    defaultValue: true,
    allowNull: true,
  },
  isCar: {
    type:DataTypes.BOOLEAN,
    field : 'is_car',
    defaultValue: true,
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

export function fxVehicleTypeFactory (sequelize: Sequelize) {
  const vVehicleType = <ModelStatic<IVehicleTypeInstance>>sequelize.define(
    'VehicleType',
    vVehicleTypeModelAttributes,
    {
      tableName: 'vehicle_types',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true
    }
  )

  vVehicleType.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vVehicleType
}