import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '../'

export interface IPaymentMethodAttributes {
  id: string
  name?: string
  fullName: string
  dni?: string
  image: string
  tax?: number
  currencyId: number
  numberAccount?: string
  accountType?: string
  email?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IPaymentMethodCreationAttributes extends Optional<IPaymentMethodAttributes, 'id'> {}

export interface IPaymentMethodInstance
  extends Model<IPaymentMethodAttributes, IPaymentMethodCreationAttributes>,
    IPaymentMethodAttributes {}

export const vPaymentMethodAttributes: SequelizeAttributes<IPaymentMethodAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING,
    field: 'full_name',
    allowNull: true,
    defaultValue: null,
  },
  dni: {
    type: DataTypes.STRING,
    field: 'dni',
    allowNull: true,
    defaultValue: null,
  },
  image: {
    type: DataTypes.STRING,
    field: 'image',
    allowNull: true,
    defaultValue: null,
  },
  tax: {
    type: DataTypes.FLOAT,
    field: 'tax',
    allowNull: true,
    defaultValue: 0,
  },
  currencyId: {
    type: DataTypes.INTEGER,
    field: 'currency_id',
  },
  numberAccount: {
    type: DataTypes.STRING,
    field: 'number_account',
    allowNull: true,
    defaultValue: null,
  },
  accountType: {
    type: DataTypes.STRING,
    field: 'account_type',
    allowNull: true,
    defaultValue: null,
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
    allowNull: true,
    defaultValue: null,
  },
}

export function fxPaymentMethodFactory(sequelize: Sequelize) {
  const vPaymentMethod = <ModelStatic<IPaymentMethodInstance>>sequelize.define(
    'PaymentMethod',
    vPaymentMethodAttributes,
    {
      tableName: 'payment_methods',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )
  vPaymentMethod.associate = function (models: ModelRegistry) {
    const { modelCurrency, modelTripPayment } = models
    modelTripPayment.belongsTo(modelCurrency, {
      targetKey: 'id',
      foreignKey: 'currencyId',
      as: 'currencyPayment',
    })
  }
  vPaymentMethod.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vPaymentMethod
}
