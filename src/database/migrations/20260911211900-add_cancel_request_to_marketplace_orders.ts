import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // Guarda el status que tenia el pedido justo antes de pasar a "cancelacion solicitada", para
    // poder restaurarlo si la tienda/admin rechaza la solicitud.
    await queryInterface.addColumn('marketplace_orders', 'previous_status', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    })
    // Motivo que da el CLIENTE al solicitar la cancelacion de un pedido ya pagado (distinto de
    // cancellation_reason, que es el motivo que da el COMERCIO al cancelar el suyo).
    await queryInterface.addColumn('marketplace_orders', 'cancel_request_reason', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    })
    await queryInterface.addColumn('marketplace_orders', 'cancel_requested_at', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('marketplace_orders', 'previous_status')
    await queryInterface.removeColumn('marketplace_orders', 'cancel_request_reason')
    await queryInterface.removeColumn('marketplace_orders', 'cancel_requested_at')
  },
}
