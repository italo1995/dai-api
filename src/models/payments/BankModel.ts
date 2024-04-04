import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IBankAttributes {
  id: number
  name: string
  icon?: string
  phoneNumber?: string
  accountNumber?: string
  currencyId?: string
  fullName: string
  dni: string
  accountType: EAccountType
  email?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IBankCreationAttributes extends Optional<IBankAttributes, 'id'> {}

export interface IBankInstance
  extends Model<IBankAttributes, IBankCreationAttributes>,
    IBankAttributes {}
export enum EAccountType {
  ahorro = 1,
  corriente = 2,
}

export const vBankAttributes: SequelizeAttributes<IBankAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
  },
  icon: {
    type: DataTypes.STRING,
    field: 'icon',
    defaultValue: null,
    allowNull: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    field: 'phone_number',
    defaultValue: null,
    allowNull: true,
  },
  accountNumber: {
    type: DataTypes.STRING,
    field: 'account_number',
    defaultValue: null,
    allowNull: true,
  },
  currencyId: {
    type: DataTypes.STRING,
    field: 'currency_id',
    defaultValue: null,
    allowNull: true,
  },
  fullName: {
    type: DataTypes.STRING,
    field: 'full_name',
  },
  dni: {
    type: DataTypes.STRING,
    field: 'dni',
  },
  accountType: {
    type: DataTypes.INTEGER,
    field: 'account_type',
  },
  email: {
    type: DataTypes.STRING,
    field: 'email',
    allowNull: true,
    defaultValue: null,
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

export function fxBankFactory(sequelize: Sequelize) {
  const vBank = <ModelStatic<IBankInstance>>sequelize.define('Bank', vBankAttributes, {
    tableName: 'banks',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vBank.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vBank
}
