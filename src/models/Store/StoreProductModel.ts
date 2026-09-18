import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import type { ModelRegistry } from '..'

export interface IStoreProductAttributes {
  id: number
  storeId: number
  name: string
  description?: string | null
  price: number
  currencyId?: number | null
  image?: string | null
  departmentId?: number | null
  isAvailable?: boolean
  isInventoryable?: boolean
  stockQuantity?: number | null
  // Volumen del producto (unidad libre - la define cada tienda/admin, ej: un tequeno 5, una torta
  // 30 porque va con caja). QA Sprint 3 #2/#6: hoy es solo el dato, el tope por vehiculo (moto vs
  // carro) todavia no esta implementado.
  volume?: number | null
  // Estadistica siempre creciente (ventas acumuladas), aparte del inventario. Se incrementa al
  // crear un pedido desde el carrito ([Orden 2/8]).
  timesSold?: number
  // precio promocional (null = sin promo activa). Se puede borrar mandando null - vuelve a
  // regir 'price'. promoEndsAt es opcional - si no se manda, la promo queda activa hasta que se
  // borre promoPrice a mano
  promoPrice?: number | null
  promoEndsAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IStoreProductCreationAttributes extends Optional<IStoreProductAttributes, 'id'> {}

export interface IStoreProductInstance
  extends Model<IStoreProductAttributes, IStoreProductCreationAttributes>,
    IStoreProductAttributes {}

export const vStoreProductModelAttributes: SequelizeAttributes<IStoreProductAttributes> = {
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
  name: {
    type: DataTypes.STRING,
    field: 'name',
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    field: 'description',
    allowNull: true,
    defaultValue: null,
  },
  price: {
    type: DataTypes.DOUBLE,
    field: 'price',
    allowNull: false,
    defaultValue: 0,
  },
  promoPrice: {
    type: DataTypes.DOUBLE,
    field: 'promo_price',
    allowNull: true,
    defaultValue: null,
  },
  promoEndsAt: {
    type: DataTypes.DATE,
    field: 'promo_ends_at',
    allowNull: true,
    defaultValue: null,
  },
  currencyId: {
    type: DataTypes.INTEGER,
    field: 'currency_id',
    allowNull: true,
    references: {
      model: {
        tableName: 'currencies',
      },
      key: 'id',
    },
  },
  image: {
    type: DataTypes.STRING,
    field: 'image',
    allowNull: true,
    defaultValue: null,
  },
  departmentId: {
    type: DataTypes.INTEGER,
    field: 'department_id',
    allowNull: true,
    defaultValue: null,
    references: {
      model: {
        tableName: 'store_departments',
      },
      key: 'id',
    },
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    field: 'is_available',
    allowNull: true,
    defaultValue: true,
  },
  isInventoryable: {
    type: DataTypes.BOOLEAN,
    field: 'is_inventoryable',
    allowNull: true,
    defaultValue: false,
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    field: 'stock_quantity',
    allowNull: true,
    defaultValue: null,
  },
  volume: {
    type: DataTypes.DOUBLE,
    field: 'volume',
    allowNull: true,
    defaultValue: null,
  },
  timesSold: {
    type: DataTypes.INTEGER,
    field: 'times_sold',
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

export function fxStoreProductFactory(sequelize: Sequelize) {
  const vStoreProduct = <ModelStatic<IStoreProductInstance>>sequelize.define(
    'StoreProduct',
    vStoreProductModelAttributes,
    {
      tableName: 'store_products',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vStoreProduct.associate = function (models: ModelRegistry) {
    const { modelStoreProduct, modelStore, modelCurrency, modelStoreDepartment, modelStoreCategory, modelStoreProductCategory, modelStoreProductModifierGroup, modelStoreProductImage } = models
    modelStoreProduct.hasOne(modelStore, {
      sourceKey: 'storeId',
      foreignKey: 'id',
      as: 'store',
    })
    modelStoreProduct.hasOne(modelCurrency, {
      sourceKey: 'currencyId',
      foreignKey: 'id',
      as: 'currency',
    })
    modelStoreProduct.hasOne(modelStoreDepartment, {
      sourceKey: 'departmentId',
      foreignKey: 'id',
      as: 'department',
    })
    modelStoreProduct.belongsToMany(modelStoreCategory, {
      through: modelStoreProductCategory,
      foreignKey: 'productId',
      otherKey: 'categoryId',
      as: 'categories',
    })
    modelStoreProduct.hasMany(modelStoreProductModifierGroup, {
      sourceKey: 'id',
      foreignKey: 'productId',
      as: 'modifierGroups',
    })
    modelStoreProduct.hasMany(modelStoreProductImage, {
      sourceKey: 'id',
      foreignKey: 'productId',
      as: 'images',
    })
  }

  vStoreProduct.prototype.toJSON = function () {
    const vValues: any = { ...this.get() }
    // finalPrice/isPromoActive calculados aca (no importado de utils/helpers, para evitar un
    // ciclo de imports models -> helpers -> services -> models) para que cualquier respuesta que
    // serialice un producto (catalogo, admin, carrito) traiga el precio ya resuelto sin que cada
    // caller tenga que repetir la comparacion de promoEndsAt.
    if (vValues.price !== undefined) {
      const vIsPromoActive =
        vValues.promoPrice !== null &&
        vValues.promoPrice !== undefined &&
        (!vValues.promoEndsAt || new Date(vValues.promoEndsAt).getTime() > Date.now())
      vValues.finalPrice = vIsPromoActive ? vValues.promoPrice : vValues.price
      vValues.isPromoActive = vIsPromoActive
    }
    return vValues
  }
  return vStoreProduct
}
