import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IVehicleAdditionalAtributes {
    id: number
    name: string
    createdAt?: Date
    updatedAt?: Date
    deletedAt?: Date
}
interface IVehicleAdditionalcreationAtributes extends Optional<IVehicleAdditionalAtributes, 'id'> {}

export interface IVehicleAdditionalInstance
    extends Model <IVehicleAdditionalAtributes, IVehicleAdditionalcreationAtributes>,
        IVehicleAdditionalAtributes {}
        
export const vVehicleadditionalModelAttributes:
SequelizeAttributes<IVehicleAdditionalAtributes> = {
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

export function fxVehicleAdditionalFactory(sequelize: Sequelize) {
  const vVehicleadditional = <ModelStatic<IVehicleAdditionalInstance>>sequelize.define(
    'VehicleAdditional',
    vVehicleadditionalModelAttributes,
    {
      tableName: 'vehicle_additionals',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  vVehicleadditional.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vVehicleadditional
}