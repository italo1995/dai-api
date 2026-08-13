import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IStoreScheduleAttributes {
  id: number
  storeId: number
  dayOfWeek: number
  openTime?: string | null
  closeTime?: string | null
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IStoreScheduleCreationAttributes extends Optional<IStoreScheduleAttributes, 'id'> {}

export interface IStoreScheduleInstance
  extends Model<IStoreScheduleAttributes, IStoreScheduleCreationAttributes>,
    IStoreScheduleAttributes {}

export const vStoreScheduleModelAttributes: SequelizeAttributes<IStoreScheduleAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  storeId: {
    type: DataTypes.INTEGER,
    field: 'store_id',
    allowNull: false,
    references: {
      model: {
        tableName: 'stores',
      },
      key: 'id',
    },
  },
  dayOfWeek: {
    type: DataTypes.INTEGER,
    field: 'day_of_week',
    allowNull: false,
  },
  openTime: {
    type: DataTypes.TIME,
    field: 'open_time',
    allowNull: true,
    defaultValue: null,
  },
  closeTime: {
    type: DataTypes.TIME,
    field: 'close_time',
    allowNull: true,
    defaultValue: null,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    field: 'is_active',
    allowNull: true,
    defaultValue: false,
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
    defaultValue: null,
  },
}

export function fxStoreScheduleFactory(sequelize: Sequelize) {
  const vStoreSchedule = <ModelStatic<IStoreScheduleInstance>>sequelize.define(
    'StoreSchedule',
    vStoreScheduleModelAttributes,
    {
      tableName: 'store_schedules',
      defaultScope: {
        order: [['dayOfWeek', 'ASC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vStoreSchedule.associate = function (models: ModelRegistry) {
    const { modelStoreSchedule, modelStore } = models
    modelStoreSchedule.hasOne(modelStore, {
      sourceKey: 'storeId',
      foreignKey: 'id',
      as: 'store',
    })
  }

  vStoreSchedule.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vStoreSchedule
}
