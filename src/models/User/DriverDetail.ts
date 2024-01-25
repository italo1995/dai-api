import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IDriverDetailAttributes {
  id: string
  sectionName: string
  fieldName: string
  type: string
  value: string
  userId: string
  createdAt?: Date
  updatedAt?: Date
}
interface IDriverDetailCreationAttributes extends Optional<IDriverDetailAttributes, 'id'> {}

export interface IDriverDetailInstance
  extends Model<IDriverDetailAttributes, IDriverDetailCreationAttributes>,
    IDriverDetailAttributes {}

export const vDriverDetailModelAttributes: SequelizeAttributes<IDriverDetailAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  sectionName: {
    type: DataTypes.STRING,
    field: 'section_name',
  },
  fieldName: {
    type: DataTypes.STRING,
    field: 'field_name',
  },
  type: {
    type: DataTypes.STRING,
    field: 'type',
  },
  value: {
    type: DataTypes.TEXT,
    field: 'value',
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
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

export function fxDriverDetailFactory(sequelize: Sequelize) {
  const vDriverDetail = <ModelStatic<IDriverDetailInstance>>sequelize.define(
    'UserCode',
    vDriverDetailModelAttributes,
    {
      tableName: 'driver_details',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  vDriverDetail.prototype.toJSON = function () {
    const values = { ...this.get() }
    return values
  }
  return vDriverDetail
}
