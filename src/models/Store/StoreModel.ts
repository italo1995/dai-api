import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export enum ETypeStore {
  FOOD = 'food',
  MARKET = 'market',
}

// Orden del listado publico de tiendas (store/all?orderBy=X). RELEVANCE es el orden de siempre
// (hoy: mas nuevas primero) - se llama asi para dejar la puerta abierta a un scoring real de
// busqueda mas adelante sin tener que inventar un cuarto valor. DISTANCE requiere que la request
// tambien mande lat/lon (si no, no hay de donde sacar la distancia).
export enum EStoreOrderBy {
  RELEVANCE = 'relevance',
  RATING = 'rating',
  DISTANCE = 'distance',
}

export interface IStoreAttributes {
  id: number
  name: string
  type: ETypeStore
  ownerId: string
  phoneCode?: string | null
  phoneNumber?: string | null
  logo?: string | null
  banner?: string | null
  description?: string | null
  lat?: number | null
  lon?: number | null
  cityId?: number | null
  regionId?: number | null
  countryId?: number | null
  isOpen?: boolean
  // null = pendiente de revision, true = aprobada, false = rechazada
  isApproved?: boolean | null
  rejectionReason?: string | null
  avgPrepTimeMinutes?: number | null
  // Denormalizado desde store_ratings (ver StoreRatingService) para no calcular el promedio en
  // cada lectura. avgRating nunca supera 5 (clamp aplicado al escribir, no al leer).
  avgRating?: number
  ratingCount?: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IStoreCreationAttributes extends Optional<IStoreAttributes, 'id'> {}

export interface IStoreInstance
  extends Model<IStoreAttributes, IStoreCreationAttributes>,
    IStoreAttributes {}

export const vStoreModelAttributes: SequelizeAttributes<IStoreAttributes> = {
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
  type: {
    type: DataTypes.STRING,
    field: 'type',
    allowNull: false,
  },
  ownerId: {
    type: DataTypes.UUID,
    field: 'owner_id',
    allowNull: false,
    references: {
      model: {
        tableName: 'users',
      },
      key: 'id',
    },
  },
  phoneCode: {
    type: DataTypes.STRING,
    field: 'phone_code',
    allowNull: true,
    defaultValue: null,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    field: 'phone_number',
    allowNull: true,
    defaultValue: null,
  },
  logo: {
    type: DataTypes.STRING,
    field: 'logo',
    allowNull: true,
    defaultValue: null,
  },
  banner: {
    type: DataTypes.STRING,
    field: 'banner',
    allowNull: true,
    defaultValue: null,
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description',
    allowNull: true,
    defaultValue: null,
  },
  lat: {
    type: DataTypes.DOUBLE,
    field: 'lat',
    allowNull: true,
    defaultValue: null,
  },
  lon: {
    type: DataTypes.DOUBLE,
    field: 'lon',
    allowNull: true,
    defaultValue: null,
  },
  cityId: {
    type: DataTypes.INTEGER,
    field: 'city_id',
    allowNull: true,
    defaultValue: null,
  },
  regionId: {
    type: DataTypes.INTEGER,
    field: 'region_id',
    allowNull: true,
    defaultValue: null,
  },
  countryId: {
    type: DataTypes.INTEGER,
    field: 'country_id',
    allowNull: true,
    defaultValue: null,
  },
  isOpen: {
    type: DataTypes.BOOLEAN,
    field: 'is_open',
    allowNull: true,
    defaultValue: true,
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    field: 'is_approved',
    allowNull: true,
    defaultValue: null,
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    field: 'rejection_reason',
    allowNull: true,
    defaultValue: null,
  },
  avgPrepTimeMinutes: {
    type: DataTypes.INTEGER,
    field: 'avg_prep_time_minutes',
    allowNull: true,
    defaultValue: null,
  },
  avgRating: {
    type: DataTypes.FLOAT,
    field: 'avg_rating',
    allowNull: false,
    defaultValue: 0,
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    field: 'rating_count',
    allowNull: false,
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

export function fxStoreFactory(sequelize: Sequelize) {
  const vStore = <ModelStatic<IStoreInstance>>sequelize.define('Store', vStoreModelAttributes, {
    tableName: 'stores',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vStore.associate = function (models: ModelRegistry) {
    const { modelStore, modelUser, modelCity, modelRegion, modelCountry, modelStoreSchedule, modelStoreProduct, modelBusinessCategory, modelStoreBusinessCategory, modelStoreRating } = models
    modelStore.hasOne(modelUser, {
      sourceKey: 'ownerId',
      foreignKey: 'id',
      as: 'owner',
    })
    modelStore.hasOne(modelCity, {
      sourceKey: 'cityId',
      foreignKey: 'id',
      as: 'city',
    })
    modelStore.hasOne(modelRegion, {
      sourceKey: 'regionId',
      foreignKey: 'id',
      as: 'region',
    })
    modelStore.hasOne(modelCountry, {
      sourceKey: 'countryId',
      foreignKey: 'id',
      as: 'country',
    })
    modelStore.hasMany(modelStoreSchedule, {
      sourceKey: 'id',
      foreignKey: 'storeId',
      as: 'schedules',
    })
    modelStore.hasMany(modelStoreProduct, {
      sourceKey: 'id',
      foreignKey: 'storeId',
      as: 'products',
    })
    modelStore.belongsToMany(modelBusinessCategory, {
      through: modelStoreBusinessCategory,
      foreignKey: 'storeId',
      otherKey: 'businessCategoryId',
      as: 'businessCategories',
    })
    modelStore.hasMany(modelStoreRating, {
      sourceKey: 'id',
      foreignKey: 'storeId',
      as: 'ratings',
    })
  }

  vStore.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vStore
}
