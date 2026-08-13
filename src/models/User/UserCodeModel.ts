import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IUserCodeAttributes {
  id: string
  code: string
  userId: string
  phoneNumber?: string
  createdAt?: Date
  updatedAt?: Date
}
interface IUserCodeCreationAttributes extends Optional<IUserCodeAttributes, 'id' | 'userId'> {}

export interface IUserCodeInstance
  extends Model<IUserCodeAttributes, IUserCodeCreationAttributes>,
    IUserCodeAttributes {}

export const vUserCodeModelAttributes: SequelizeAttributes<IUserCodeAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING,
    field: 'code',
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
  },
  phoneNumber: {
    type: DataTypes.STRING,
    field: 'phone_number',
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

export function fxUserCodeFactory(sequelize: Sequelize) {
  const vUserCode = <ModelStatic<IUserCodeInstance>>sequelize.define(
    'UserCode',
    vUserCodeModelAttributes,
    {
      tableName: 'user_codes',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  vUserCode.prototype.toJSON = function () {
    const values = { ...this.get() }
    return values
  }
  return vUserCode
}
