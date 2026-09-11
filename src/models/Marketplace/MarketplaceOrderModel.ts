import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

// Estado de NEGOCIO del pedido - a proposito separado de EStatusTrip (TripModel.ts), que sigue
// siendo solo el estado de TRANSPORTE (compartido con viajes normales). 'preparando' no es un
// estado de transporte (todavia no hay ruta ni conductor), y 'pedido_recogido' no tiene
// equivalente en EStatusTrip (para un viaje normal, recoger al pasajero ES el inicio del viaje).
// Ver ARQUITECTURA_MARKETPLACE.md seccion 1 para el razonamiento completo.
export enum EMarketplaceOrderStatus {
  PENDIENTE_CONFIRMACION = 'pendiente de confirmacion',
  PREPARANDO = 'preparando pedido',
  BUSCANDO_CONDUCTOR = 'buscando conductor',
  CONDUCTOR_ASIGNADO = 'conductor asignado',
  PEDIDO_RECOGIDO = 'pedido recogido',
  ENTREGADO = 'pedido entregado',
  CANCELADO = 'cancelado',
}

// Que vehiculo debe usar el repartidor para esta entrega - lo elige el cliente al pedir, no se
// infiere del store ni del driver (un mismo repartidor puede tener moto y auto habilitados).
export enum EMarketplaceOrderVehicle {
  MOTO = 'moto',
  CARRO = 'carro',
}

export interface IMarketplaceOrderAttributes {
  id: number
  storeId: number
  customerId: string
  // Nace en null - el pedido existe ANTES de que haya un viaje (mientras el comercio todavia
  // no confirmo ni fijo tiempo de preparacion). Se completa recien cuando arranca la busqueda
  // de conductor (tarea 5/8 del desglose de Orden).
  tripId?: number | null
  status: EMarketplaceOrderStatus
  // Snapshot de moneda/cupon al momento de crear el pedido - igual que en cart_items, el
  // catalogo puede cambiar de precio despues sin afectar un pedido ya hecho.
  currencyId?: number | null
  couponId?: number | null
  discount: number
  deliveryFee: number
  // Minutos que declara el comercio al confirmar (tarea 3/8). Regla: <20 -> despacho
  // inmediato, >=20 -> despacho diferido (readyAt/dispatchAt calculados ahi mismo).
  prepTimeMinutes?: number | null
  readyAt?: Date | null
  dispatchAt?: Date | null
  // Destino de la entrega (el origen es la tienda). Se captura al crear el pedido ([Orden 2/8])
  // y se usa como endRoute del viaje al despachar ([Orden 5/8]).
  deliveryLat?: number | null
  deliveryLon?: number | null
  deliveryAddress?: string | null
  // Motivo de cancelacion que da el comercio ([Orden 7/8]).
  cancellationReason?: string | null
  // Que vehiculo pidio el cliente para la entrega - lo manda la app al crear el pedido.
  vehicle: EMarketplaceOrderVehicle
  // Metodo de pago elegido de entre los configurados por la tienda (store_payment_methods).
  paymentMethodId?: number | null
  // Punto de referencia para ubicar la entrega - texto libre y/o foto, ambos opcionales.
  referencePointText?: string | null
  referencePhoto?: string | null
  notes?: string | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}
interface IMarketplaceOrderCreationAttributes extends Optional<IMarketplaceOrderAttributes, 'id' | 'status' | 'discount' | 'deliveryFee'> {}

export interface IMarketplaceOrderInstance
  extends Model<IMarketplaceOrderAttributes, IMarketplaceOrderCreationAttributes>,
    IMarketplaceOrderAttributes {}

export const vMarketplaceOrderModelAttributes: SequelizeAttributes<IMarketplaceOrderAttributes> = {
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
      model: { tableName: 'stores' },
      key: 'id',
    },
  },
  customerId: {
    type: DataTypes.UUID,
    field: 'customer_id',
    allowNull: false,
    references: {
      model: { tableName: 'users' },
      key: 'id',
    },
  },
  tripId: {
    type: DataTypes.INTEGER,
    field: 'trip_id',
    allowNull: true,
    defaultValue: null,
    references: {
      model: { tableName: 'trips' },
      key: 'id',
    },
  },
  status: {
    type: DataTypes.STRING,
    field: 'status',
    allowNull: false,
    defaultValue: EMarketplaceOrderStatus.PENDIENTE_CONFIRMACION,
  },
  currencyId: {
    type: DataTypes.INTEGER,
    field: 'currency_id',
    allowNull: true,
    defaultValue: null,
    references: {
      model: { tableName: 'currencies' },
      key: 'id',
    },
  },
  couponId: {
    type: DataTypes.INTEGER,
    field: 'coupon_id',
    allowNull: true,
    defaultValue: null,
    references: {
      model: { tableName: 'coupons' },
      key: 'id',
    },
  },
  discount: {
    type: DataTypes.DOUBLE,
    field: 'discount',
    allowNull: false,
    defaultValue: 0,
  },
  deliveryFee: {
    type: DataTypes.DOUBLE,
    field: 'delivery_fee',
    allowNull: false,
    defaultValue: 0,
  },
  prepTimeMinutes: {
    type: DataTypes.INTEGER,
    field: 'prep_time_minutes',
    allowNull: true,
    defaultValue: null,
  },
  readyAt: {
    type: DataTypes.DATE,
    field: 'ready_at',
    allowNull: true,
    defaultValue: null,
  },
  dispatchAt: {
    type: DataTypes.DATE,
    field: 'dispatch_at',
    allowNull: true,
    defaultValue: null,
  },
  deliveryLat: {
    type: DataTypes.DOUBLE,
    field: 'delivery_lat',
    allowNull: true,
    defaultValue: null,
  },
  deliveryLon: {
    type: DataTypes.DOUBLE,
    field: 'delivery_lon',
    allowNull: true,
    defaultValue: null,
  },
  deliveryAddress: {
    type: DataTypes.STRING,
    field: 'delivery_address',
    allowNull: true,
    defaultValue: null,
  },
  cancellationReason: {
    type: DataTypes.STRING,
    field: 'cancellation_reason',
    allowNull: true,
    defaultValue: null,
  },
  vehicle: {
    type: DataTypes.STRING,
    field: 'vehicle',
    allowNull: false,
    defaultValue: EMarketplaceOrderVehicle.MOTO,
  },
  paymentMethodId: {
    type: DataTypes.INTEGER,
    field: 'payment_method_id',
    allowNull: true,
    defaultValue: null,
    references: {
      model: { tableName: 'store_payment_methods' },
      key: 'id',
    },
  },
  referencePointText: {
    type: DataTypes.STRING,
    field: 'reference_point_text',
    allowNull: true,
    defaultValue: null,
  },
  referencePhoto: {
    type: DataTypes.STRING,
    field: 'reference_photo',
    allowNull: true,
    defaultValue: null,
  },
  notes: {
    type: DataTypes.STRING,
    field: 'notes',
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

export function fxMarketplaceOrderFactory(sequelize: Sequelize) {
  const vMarketplaceOrder = <ModelStatic<IMarketplaceOrderInstance>>sequelize.define(
    'MarketplaceOrder',
    vMarketplaceOrderModelAttributes,
    {
      tableName: 'marketplace_orders',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vMarketplaceOrder.associate = function (models: ModelRegistry) {
    const { modelMarketplaceOrder, modelMarketplaceOrderItem, modelStore, modelUser, modelTrip, modelCurrency, modelCoupon, modelStorePaymentMethod } = models
    modelMarketplaceOrder.hasMany(modelMarketplaceOrderItem, {
      sourceKey: 'id',
      foreignKey: 'orderId',
      as: 'items',
    })
    modelMarketplaceOrder.hasOne(modelStore, {
      sourceKey: 'storeId',
      foreignKey: 'id',
      as: 'store',
    })
    modelMarketplaceOrder.hasOne(modelUser, {
      sourceKey: 'customerId',
      foreignKey: 'id',
      as: 'customer',
    })
    modelMarketplaceOrder.hasOne(modelTrip, {
      sourceKey: 'tripId',
      foreignKey: 'id',
      as: 'trip',
    })
    modelMarketplaceOrder.hasOne(modelCurrency, {
      sourceKey: 'currencyId',
      foreignKey: 'id',
      as: 'currency',
    })
    modelMarketplaceOrder.hasOne(modelCoupon, {
      sourceKey: 'couponId',
      foreignKey: 'id',
      as: 'coupon',
    })
    modelMarketplaceOrder.hasOne(modelStorePaymentMethod, {
      sourceKey: 'paymentMethodId',
      foreignKey: 'id',
      as: 'paymentMethod',
    })
  }

  vMarketplaceOrder.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vMarketplaceOrder
}
