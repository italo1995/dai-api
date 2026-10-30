import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

// Recuperacion de contraseña de tiendas (Italo, 2026-10-29) - ver la migracion para el contexto
// completo. tokenHash es el sha256 del secreto (token del enlace o codigo SMS), nunca el valor en
// claro.
export type TPasswordResetChannel = 'admin_link' | 'sms'

export interface IPasswordResetTokenAttributes {
  id: number
  userId: string
  tokenHash: string
  channel: TPasswordResetChannel
  expiresAt: Date
  usedAt?: Date | null
  attempts?: number
  createdBy?: string | null
  createdAt?: Date
  updatedAt?: Date
}
interface IPasswordResetTokenCreationAttributes extends Optional<IPasswordResetTokenAttributes, 'id'> {}

export interface IPasswordResetTokenInstance
  extends Model<IPasswordResetTokenAttributes, IPasswordResetTokenCreationAttributes>,
    IPasswordResetTokenAttributes {}

export const vPasswordResetTokenModelAttributes: SequelizeAttributes<IPasswordResetTokenAttributes> = {
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
  tokenHash: {
    type: DataTypes.STRING(64),
    field: 'token_hash',
    allowNull: false,
  },
  channel: {
    type: DataTypes.STRING(20),
    field: 'channel',
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    field: 'expires_at',
    allowNull: false,
  },
  usedAt: {
    type: DataTypes.DATE,
    field: 'used_at',
    allowNull: true,
    defaultValue: null,
  },
  attempts: {
    type: DataTypes.INTEGER,
    field: 'attempts',
    allowNull: false,
    defaultValue: 0,
  },
  createdBy: {
    type: DataTypes.UUID,
    field: 'created_by',
    allowNull: true,
    defaultValue: null,
    references: {
      model: { tableName: 'users' },
      key: 'id',
    },
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

export function fxPasswordResetTokenFactory(sequelize: Sequelize) {
  const vPasswordResetToken = <ModelStatic<IPasswordResetTokenInstance>>sequelize.define(
    'PasswordResetToken',
    vPasswordResetTokenModelAttributes,
    {
      tableName: 'password_reset_tokens',
      freezeTableName: true,
      timestamps: true,
    }
  )

  // El hash no tiene por que salir nunca en una respuesta, aunque alguien serialice la fila.
  vPasswordResetToken.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    delete vValues.tokenHash
    return vValues
  }
  return vPasswordResetToken
}
