import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '../'

export interface ICurrencyAttributes {
  id: string
  name: string
  symbol: string
  change: number
  type: boolean
  auto?: string
  icon?: string
  orden?: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface ICurrencyCreationAttributes extends Optional<ICurrencyAttributes, 'id'> {}

export interface ICurrencyInstance
  extends Model<ICurrencyAttributes, ICurrencyCreationAttributes>,
    ICurrencyAttributes {}

export const vCurrencyAttributes: SequelizeAttributes<ICurrencyAttributes> = {
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
  symbol: {
    type: DataTypes.STRING,
    field: 'symbol',
  },
  change: {
    type: DataTypes.FLOAT,
    field: 'change',
  },
  type: {
    type: DataTypes.BOOLEAN,
    field: 'type',
    defaultValue: true,
    allowNull: true,
  },
  auto: {
    type: DataTypes.STRING,
    field: 'auto',
    defaultValue: true,
    allowNull: true,
  },
  icon: {
    type: DataTypes.STRING,
    field: 'icon',
    defaultValue: null,
    allowNull: true,
  },
  orden: {
    type: DataTypes.NUMBER,
    field: 'orden',
    allowNull: true,
    defaultValue: 0,
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

export function fxCurrencyFactory(sequelize: Sequelize) {
  const vCurrency = <ModelStatic<ICurrencyInstance>>sequelize.define(
    'Currency',
    vCurrencyAttributes,
    {
      tableName: 'currencies',
      defaultScope: {
        order: [['orden', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )
  vCurrency.associate = function (models: ModelRegistry) {
    const { modelCurrency, modelTripPayment } = models
    modelCurrency.hasOne(modelTripPayment, {
      sourceKey: 'id',
      foreignKey: 'currency_id',
      as: 'tripPayment',
    })
  }
  vCurrency.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vCurrency
}
