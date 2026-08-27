import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IStoreCurrencyAttributes {
  id: number
  storeId: number
  currencyId: number
  exchangeRate: number
  isDefault?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IStoreCurrencyCreationAttributes extends Optional<IStoreCurrencyAttributes, 'id'> {}

export interface IStoreCurrencyInstance
  extends Model<IStoreCurrencyAttributes, IStoreCurrencyCreationAttributes>,
    IStoreCurrencyAttributes {}

export const vStoreCurrencyModelAttributes: SequelizeAttributes<IStoreCurrencyAttributes> = {
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
  currencyId: {
    type: DataTypes.INTEGER,
    field: 'currency_id',
    allowNull: false,
    references: {
      model: {
        tableName: 'currencies',
      },
      key: 'id',
    },
  },
  exchangeRate: {
    type: DataTypes.DOUBLE,
    field: 'exchange_rate',
    allowNull: false,
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    field: 'is_default',
    allowNull: false,
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

export function fxStoreCurrencyFactory(sequelize: Sequelize) {
  const vStoreCurrency = <ModelStatic<IStoreCurrencyInstance>>sequelize.define(
    'StoreCurrency',
    vStoreCurrencyModelAttributes,
    {
      tableName: 'store_currencies',
      defaultScope: {
        order: [['isDefault', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vStoreCurrency.associate = function (models: ModelRegistry) {
    const { modelStoreCurrency, modelStore, modelCurrency } = models
    modelStoreCurrency.hasOne(modelStore, {
      sourceKey: 'storeId',
      foreignKey: 'id',
      as: 'store',
    })
    modelStoreCurrency.hasOne(modelCurrency, {
      sourceKey: 'currencyId',
      foreignKey: 'id',
      as: 'currency',
    })
  }

  vStoreCurrency.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vStoreCurrency
}
