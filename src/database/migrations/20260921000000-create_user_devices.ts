import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // Multi-dispositivo (Italo, 2026-09-21): hasta ahora "users.socket_id"/"users.token_push"
    // eran un solo valor por cuenta, asi que si dos personas (o dos pestañas/celulares) entraban
    // con la MISMA cuenta de tienda o de admin al mismo tiempo, el segundo pisaba el dato del
    // primero - solo el ultimo conectado recibia notificaciones/eventos en tiempo real, sin
    // ningun aviso de que eso paso. Esta tabla es un registro ADICIONAL (no reemplaza las
    // columnas viejas, que se siguen escribiendo igual que siempre para no romper nada que las
    // lea directo) de TODOS los dispositivos conectados/registrados por usuario, para poder
    // avisarles a todos en vez de solo al ultimo. Alcance inicial: solo admin/operator/tienda
    // (rolId 1/2/4) - ver UserDeviceService.ts y los puntos donde se escribe (ws.ts, AuthController).
    return queryInterface.createTable('user_devices', {
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
      // Un socket conectado ahora mismo - se borra la fila entera al desconectarse (ver
      // 'disconnect' en ws.ts), no queda historial de sockets viejos.
      socketId: {
        type: DataTypes.STRING,
        field: 'socket_id',
        allowNull: true,
        defaultValue: null,
      },
      // Un token de push (FCM) que este usuario registro alguna vez desde este dispositivo - a
      // diferencia del socket, este SI persiste entre sesiones (no se borra al desconectar).
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
    }).then(() => queryInterface.addIndex('user_devices', ['user_id']))
  },
  async down(queryInterface: QueryInterface) {
    return queryInterface.dropTable('user_devices')
  },
}
