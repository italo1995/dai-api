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
  // Moneda en la que se cobra con este metodo (ej: Zelle -> USD, Pago Movil -> Bolivar). Nullable
  // a proposito: un metodo como 'efectivo' puede no atarse a una sola moneda especifica. No
  // referencia store_currencies - es la moneda base (tabla currencies), independiente de si la
  // tienda declaro esa moneda como aceptada ahi.
  currencyId?: number | null
  // Icono generico elegido de la libreria (media_library_items, type='payment_method') - null si
  // la tienda subio uno propio (customIcon) o si no eligio ninguno.
  iconId?: number | null
  // Icono propio de esta tienda para este metodo puntual, alternativa a iconId (uno u otro, no
  // los dos - eso lo resuelve el form del panel, no el modelo).
  customIcon?: string | null
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
  currencyId: {
    type: DataTypes.INTEGER,
    field: 'currency_id',
    allowNull: true,
    defaultValue: null,
    references: {
      model: {
        tableName: 'currencies',
      },
      key: 'id',
    },
  },
  iconId: {
    type: DataTypes.INTEGER,
    field: 'icon_id',
    allowNull: true,
    defaultValue: null,
    references: {
      model: {
        tableName: 'media_library_items',
      },
      key: 'id',
    },
  },
  customIcon: {
    type: DataTypes.STRING,
    field: 'custom_icon',
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
    const { modelStorePaymentMethod, modelStore, modelCurrency, modelMediaLibraryItem } = models
    modelStorePaymentMethod.hasOne(modelStore, {
      sourceKey: 'storeId',
      foreignKey: 'id',
      as: 'store',
    })
    modelStorePaymentMethod.hasOne(modelCurrency, {
      sourceKey: 'currencyId',
      foreignKey: 'id',
      as: 'currency',
    })
    modelStorePaymentMethod.hasOne(modelMediaLibraryItem, {
      sourceKey: 'iconId',
      foreignKey: 'id',
      as: 'icon',
    })
  }

  vStorePaymentMethod.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vStorePaymentMethod
}
