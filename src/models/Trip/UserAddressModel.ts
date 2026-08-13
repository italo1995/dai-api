import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IUserAddressAttributes {
  id: string
  userId: string
  name: string
  address: string
  reference: string
  lat: number
  lon: number
  file?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IUserAddressCreationAttributes extends Optional<IUserAddressAttributes, 'id'> {}

export interface IUserAddressInstance
  extends Model<IUserAddressAttributes, IUserAddressCreationAttributes>,
    IUserAddressAttributes {}

export const vUserAddressModelAttributes: SequelizeAttributes<IUserAddressAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
  },
  address: {
    type: DataTypes.TEXT,
    field: 'address',
    defaultValue: '',
    allowNull: false,
  },
  reference: {
    type: DataTypes.TEXT,
    field: 'reference',
    defaultValue: '',
    allowNull: true,
  },
  lat: {
    type: DataTypes.DOUBLE,
    field: 'lat',
    allowNull: false,
  },
  lon: {
    type: DataTypes.DOUBLE,
    field: 'lon',
    allowNull: false,
  },
  file: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    field: 'file',
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'createdAt',
    allowNull: true,
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updatedAt',
    allowNull: true,
  },
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deletedAt',
    allowNull: true,
    defaultValue: null,
  },
}

export function fxUserAddressFactory(sequelize: Sequelize) {
  const vUserAddress = <ModelStatic<IUserAddressInstance>>sequelize.define(
    'UserAddress',
    vUserAddressModelAttributes,
    {
      tableName: 'user_addresses',
      defaultScope: {
        attributes: {
          exclude: ['deletedAt', 'userId'],
        },
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vUserAddress.prototype.toJSON = function () {
    const values = { ...this.get() }
    return values
  }
  return vUserAddress
}
