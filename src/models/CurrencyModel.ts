import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../types/SequelizeTypes'

export interface ICurrencyAttributes {
  id: string
  name: string
  symbol: string
  change: number
  type: boolean
  auto?: string
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
    defaultValue: null
  },
}

export function fxCurrencyFactory(sequelize: Sequelize) {
  const vCurrency = <ModelStatic<ICurrencyInstance>>sequelize.define('Currency', vCurrencyAttributes, {
    tableName: 'currencies',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vCurrency.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vCurrency
}
