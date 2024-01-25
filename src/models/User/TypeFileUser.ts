import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ITypeFileUserAttributes {
  id: number
  name: string
  description: string
  isVisibility?: boolean
  required?: boolean
  createdAt?: Date
  updatedAt?: Date
}
interface ITypeFileUserCreationAttributes extends Optional<ITypeFileUserAttributes, 'id' | 'description'> {}

export interface ITypeFileUserInstance
  extends Model<ITypeFileUserAttributes, ITypeFileUserCreationAttributes>,
    ITypeFileUserAttributes {}

export const vTypeFileUserModelAttributes: SequelizeAttributes<ITypeFileUserAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
  },
  description: {
    type: DataTypes.STRING,
    field: 'description',
  },
  isVisibility: {
    type: DataTypes.BOOLEAN,
    field: 'is_visibility',
    defaultValue: true
  },
  required: {
    type: DataTypes.BOOLEAN,
    field: 'required',
    defaultValue: false
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

export function fxTypeFileUserFactory(sequelize: Sequelize) {
  const TypeFileUser = <ModelStatic<ITypeFileUserInstance>>sequelize.define(
    'TypeFileUser',
    vTypeFileUserModelAttributes,
    {
      tableName: 'typeFileUsers',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  TypeFileUser.prototype.toJSON = function () {
    const values = { ...this.get() }
    return values
  }
  return TypeFileUser
}
