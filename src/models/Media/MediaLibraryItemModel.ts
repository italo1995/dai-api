import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

// Libreria de iconos/imagenes genericos que administra admin/operator, para no depender de que
// cada tienda suba su propio icono para cosas comunes (Nequi, Bancolombia, etc). 'type' es texto
// libre a proposito - hoy solo se usa 'payment_method', pero la idea (pedido de Italo,
// 2026-09-11) es reusar esta misma tabla para otras librerias de medios mas adelante sin
// necesitar una migracion nueva por cada una.
export interface IMediaLibraryItemAttributes {
  id: number
  name: string
  image: string
  type: string
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IMediaLibraryItemCreationAttributes extends Optional<IMediaLibraryItemAttributes, 'id' | 'isActive'> {}

export interface IMediaLibraryItemInstance
  extends Model<IMediaLibraryItemAttributes, IMediaLibraryItemCreationAttributes>,
    IMediaLibraryItemAttributes {}

export const vMediaLibraryItemModelAttributes: SequelizeAttributes<IMediaLibraryItemAttributes> = {
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
  image: {
    type: DataTypes.STRING,
    field: 'image',
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    field: 'type',
    allowNull: false,
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

export function fxMediaLibraryItemFactory(sequelize: Sequelize) {
  const vMediaLibraryItem = <ModelStatic<IMediaLibraryItemInstance>>sequelize.define(
    'MediaLibraryItem',
    vMediaLibraryItemModelAttributes,
    {
      tableName: 'media_library_items',
      defaultScope: {
        order: [['name', 'ASC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vMediaLibraryItem.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vMediaLibraryItem
}
