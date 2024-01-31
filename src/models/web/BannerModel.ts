import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IBannerAttributes {
  id: string
  name: string
  image: string
  orden?: number
  link?: string
  state?: boolean
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}
interface IBannerCreationAttributes extends Optional<IBannerAttributes, 'id'> {}

export interface IBannerInstance
  extends Model<IBannerAttributes, IBannerCreationAttributes>,
    IBannerAttributes {}

export const vBannerAttributes: SequelizeAttributes<IBannerAttributes> = {
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
  image: {
    type: DataTypes.STRING,
    field: 'image',
  },
  orden: {
    type: DataTypes.INTEGER,
    field: 'orden',
    defaultValue: null,
    allowNull: true,
  },
  link: {
    type: DataTypes.STRING,
    field: 'link',
    defaultValue: true,
    allowNull: true,
  },
  state: {
    type: DataTypes.BOOLEAN,
    field: 'status',
    defaultValue: null,
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
    allowNull: false,
  },
}

export function fxBannerFactory(sequelize: Sequelize) {
  const vBanner = <ModelStatic<IBannerInstance>>sequelize.define('Banner', vBannerAttributes, {
    tableName: 'banner',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vBanner.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vBanner
}
