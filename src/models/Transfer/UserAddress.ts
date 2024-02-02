import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IUserAddresses {
  id: string
  userId: number
  name: string
  address: string
  reference: string
  lat: number
  lon: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IUserAddressCreationAttributes extends Optional<IUserAddresses, 'id'> {}

export interface IDriverDetailInstance
  extends Model<IUserAddresses, IUserAddressCreationAttributes>,
    IUserAddresses {}

export const vUserAddressModelAttributes: SequelizeAttributes<IUserAddresses> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_Id',
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
  },
  address: {
    type: DataTypes.TEXT,
    field: 'address',
    defaultValue: '',
    allowNull: true,
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
  },
  lon: {
    type: DataTypes.DOUBLE,
    field: 'lon',
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
    allowNull: false,
  },
}

export function fxUserAddressFactory(sequelize: Sequelize) {
  const vUserAddress = <ModelStatic<IDriverDetailInstance>>sequelize.define(
    'UserAddress',
    vUserAddressModelAttributes,
    {
      tableName: 'user_addresses',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  vUserAddress.prototype.toJSON = function () {
    const values = { ...this.get() }
    return values
  }
  return vUserAddress
}
