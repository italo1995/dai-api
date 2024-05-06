import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IBankAttributes {
  id: number
  name: string
  icon?: string
  phoneNumber?: string
  accountNumber?: string
  currencyId?: number
  fullName: string
  dni: string
  accountType: EAccountType
  email?: string
  hasCapture?: boolean
  isConvert?: boolean
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
export enum EPaymentType {
  TODOS = 0,
  EFECTIVO = 1,
  ELECTRONICO = 2
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
    type: DataTypes.INTEGER,
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
  hasCapture: {
    type: DataTypes.BOOLEAN,
    field: 'has_capture',
    allowNull: true,
    defaultValue: false,
  },
  isConvert: {
    type: DataTypes.BOOLEAN,
    field: 'is_convert',
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

  vBank.associate = function (models: ModelRegistry) {
    const { modelBank, modelCurrency } = models
    modelBank.hasOne(modelCurrency, {
      foreignKey: 'id',
      sourceKey: 'currencyId',
      as: 'currency',
    })
  }

  vBank.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vBank
}
