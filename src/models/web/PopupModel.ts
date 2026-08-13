import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IPopupAttributes {
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
interface IPopupCreationAttributes extends Optional<IPopupAttributes, 'id'> {}

export interface IPopupInstance
  extends Model<IPopupAttributes, IPopupCreationAttributes>,
    IPopupAttributes {}

export const vPopupAttributes: SequelizeAttributes<IPopupAttributes> = {
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
  orden: {
    type: DataTypes.INTEGER,
    field: 'orden',
    defaultValue: null,
    allowNull: true,
  },
  link: {
    type: DataTypes.STRING,
    field: 'link',
    defaultValue: null,
    allowNull: true,
  },
  state: {
    type: DataTypes.BOOLEAN,
    field: 'status',
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
    defaultValue: null,
  },
}

export function fxPopupFactory(sequelize: Sequelize) {
  const vPopup = <ModelStatic<IPopupInstance>>sequelize.define('Popup', vPopupAttributes, {
    tableName: 'popups',
    defaultScope: {
      order: [
        ['orden', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vPopup.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vPopup
}
