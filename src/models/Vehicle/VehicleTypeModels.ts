import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IVehicleTypeAtributes {
    id: number
    name: string
    createdAt?: Date
    updatedAt?: Date
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
      tableName: 'vehicle_Types',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  vVehicleType.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vVehicleType
}