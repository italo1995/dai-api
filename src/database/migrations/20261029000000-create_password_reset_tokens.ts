import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // Recuperacion de contraseña de tiendas (Italo, 2026-10-29): las tiendas entran al panel web
    // con email y contraseña y hasta ahora no tenian como recuperarla (no hay servicio de correo).
    // Dos canales, ambos guardan aca un secreto de un solo uso: 'admin_link' (enlace que genera el
    // admin despues de verificar a la tienda por llamada) y 'sms' (codigo de 6 digitos al telefono
    // registrado). Nunca se guarda el token/codigo en claro, solo su sha256 - si se filtra la tabla
    // no sirve para entrar. Ver PasswordResetService.ts.
    return queryInterface
      .createTable('password_reset_tokens', {
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
            model: 'users',
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
        // Se llena al usarlo y tambien al invalidarlo (por generar uno nuevo, por agotar los
        // intentos, o porque la contraseña ya se cambio por el otro canal) - en ambos casos deja de
        // servir, que es lo unico que importa al validar.
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
        // Admin/operador que genero el enlace (null para el canal 'sms', que lo pide la tienda).
        createdBy: {
          type: DataTypes.UUID,
          field: 'created_by',
          allowNull: true,
          defaultValue: null,
          references: {
            model: 'users',
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
      })
      .then(() => queryInterface.addIndex('password_reset_tokens', ['user_id']))
      .then(() => queryInterface.addIndex('password_reset_tokens', ['token_hash']))
  },
  async down(queryInterface: QueryInterface) {
    return queryInterface.dropTable('password_reset_tokens')
  },
}
