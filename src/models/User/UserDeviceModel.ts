import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

// Registro de dispositivos por usuario (Italo, 2026-09-21) - ver la migracion para el contexto
// completo. Una fila puede tener socketId, tokenPush, o ambos; no hay una relacion 1:1 entre
// "un dispositivo" y "una fila" muy estricta (un mismo celular puede aparecer como una fila con
// socketId y otra con tokenPush si se registraron en momentos distintos) - lo unico que importa
// es poder juntar TODOS los socketId/tokenPush vigentes de un usuario para avisarles a todos.
export interface IUserDeviceAttributes {
  id: number
  userId: string
  socketId?: string | null
  tokenPush?: string | null
  createdAt?: Date
  updatedAt?: Date
}
interface IUserDeviceCreationAttributes extends Optional<IUserDeviceAttributes, 'id'> {}

export interface IUserDeviceInstance
  extends Model<IUserDeviceAttributes, IUserDeviceCreationAttributes>,
    IUserDeviceAttributes {}

export const vUserDeviceModelAttributes: SequelizeAttributes<IUserDeviceAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.UUID,
    field: 'user_id',
    allowNull: false,
    references: {
      model: { tableName: 'users' },
      key: 'id',
    },
  },
  socketId: {
    type: DataTypes.STRING,
    field: 'socket_id',
    allowNull: true,
    defaultValue: null,
  },
  tokenPush: {
    type: DataTypes.STRING,
    field: 'token_push',
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
}

export function fxUserDeviceFactory(sequelize: Sequelize) {
  const vUserDevice = <ModelStatic<IUserDeviceInstance>>sequelize.define(
    'UserDevice',
    vUserDeviceModelAttributes,
    {
      tableName: 'user_devices',
      freezeTableName: true,
      timestamps: true,
    }
  )

  vUserDevice.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vUserDevice
}
