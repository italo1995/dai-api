import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

// No es el mismo catalogo que PaymentMethod (ese es global, del modulo de traslados). Aca cada
// tienda arma su propia lista dinamica - "otro" es la valvula de escape para lo que no entre en
// las opciones tipicas de LATAM.
export enum EStorePaymentMethodType {
  EFECTIVO = 'efectivo',
  TRANSFERENCIA = 'transferencia',
  ZELLE = 'zelle',
  NEQUI = 'nequi',
  PAGO_MOVIL = 'pago_movil',
  OTRO = 'otro',
}

export interface IStorePaymentMethodAttributes {
  id: number
  storeId: number
  type: EStorePaymentMethodType
  label?: string | null
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IStorePaymentMethodCreationAttributes extends Optional<IStorePaymentMethodAttributes, 'id'> {}

export interface IStorePaymentMethodInstance
  extends Model<IStorePaymentMethodAttributes, IStorePaymentMethodCreationAttributes>,
    IStorePaymentMethodAttributes {}

export const vStorePaymentMethodModelAttributes: SequelizeAttributes<IStorePaymentMethodAttributes> = {
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
  type: {
    type: DataTypes.STRING,
    field: 'type',
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING,
    field: 'label',
    allowNull: true,
    defaultValue: null,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    field: 'is_active',
    allowNull: false,
    defaultValue: true,
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

export function fxStorePaymentMethodFactory(sequelize: Sequelize) {
  const vStorePaymentMethod = <ModelStatic<IStorePaymentMethodInstance>>sequelize.define(
    'StorePaymentMethod',
    vStorePaymentMethodModelAttributes,
    {
      tableName: 'store_payment_methods',
      defaultScope: {
        order: [['createdAt', 'ASC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vStorePaymentMethod.associate = function (models: ModelRegistry) {
    const { modelStorePaymentMethod, modelStore } = models
    modelStorePaymentMethod.hasOne(modelStore, {
      sourceKey: 'storeId',
      foreignKey: 'id',
      as: 'store',
    })
  }

  vStorePaymentMethod.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vStorePaymentMethod
}
