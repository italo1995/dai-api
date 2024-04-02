import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import { v4 as uuidv4 } from 'uuid'

export interface IUserTransactionAtributes {
  id: string
  userId: string
  operatorId: string
  amount: number
  transactionType: EtransactionType
  status: EStatusType
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IUserTransactionCreationAttributes extends Optional<IUserTransactionAtributes, 'id'> {}

export interface IUserTransactionInstance
  extends Model<IUserTransactionAtributes, IUserTransactionCreationAttributes>,
    IUserTransactionAtributes {}

export enum EtransactionType {
  deposit = 1,
  expense = 2,
}

export enum EStatusType {
  pending = 1,
  approved = 2,
  denied = 3,
}

export const vUserTransactionAttributes: SequelizeAttributes<IUserTransactionAtributes> = {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'userId',
  },
  operatorId: {
    type: DataTypes.STRING,
    field: 'operator_id',
  },
  amount: {
    type: DataTypes.FLOAT,
    field: 'amount',
  },
  transactionType: {
    type: DataTypes.INTEGER,
    field: 'transaction_type',
  },
  status: {
    type: DataTypes.STRING,
    field: 'status',
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

export function fxUserTransactionFactory(sequelize: Sequelize) {
  const vDataBase = <ModelStatic<IUserTransactionInstance>>sequelize.define(
    'UserTransaction',
    vUserTransactionAttributes,
    {
      tableName: 'user_transaction',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vDataBase.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vDataBase
}
