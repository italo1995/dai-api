import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // Motivo que da el comercio al cancelar un pedido ([Orden 7/8]). Se muestra al cliente en el
    // aviso de cancelacion.
    return queryInterface.addColumn('marketplace_orders', 'cancellation_reason', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    })
  },
  async down(queryInterface: QueryInterface) {
    return queryInterface.removeColumn('marketplace_orders', 'cancellation_reason')
  },
}
