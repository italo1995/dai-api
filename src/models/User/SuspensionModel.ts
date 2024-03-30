import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ISuspensionAttributes {
  id: number
  driverId: string
  reason: string
  timeFrame: ETypeTime
  init: Date
  end: Date
  isCanceled?: boolean
  hours?: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface ISuspensionCreationAttributes extends Optional<ISuspensionAttributes, 'id'> {}

export interface ISuspensionInstance
  extends Model<ISuspensionAttributes, ISuspensionCreationAttributes>,
    ISuspensionAttributes {}

export enum ETypeTime {
  indefinido = 1,
  hoy = 2,
  horas = 3,
  fecha = 4
}

export const vSuspensionAttributes: SequelizeAttributes<ISuspensionAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  driverId: {
    type: DataTypes.STRING,
    field: 'driver_id'
  },
  reason: {
    type: DataTypes.TEXT,
    field: 'reason'
  },
  timeFrame: {
    type: DataTypes.INTEGER,
    field: 'time_frame',
  },
  init: {
    type: DataTypes.DATE,
    field: 'init',
    allowNull: false
  },
  end:{
    type: DataTypes.DATE,
    field: 'end',
    allowNull: false
  },
  isCanceled: {
    type: DataTypes.BOOLEAN,
    field: 'is_canceled'
  },
  hours: {
    type: DataTypes.INTEGER,
    field: 'hours',
    allowNull: true,
    defaultValue: null
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

export function fxSuspensionFactory(sequelize: Sequelize) {
  const vSuspension = <ModelStatic<ISuspensionInstance>>sequelize.define('Suspension', vSuspensionAttributes, {
    tableName: 'suspension',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vSuspension.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vSuspension
}
