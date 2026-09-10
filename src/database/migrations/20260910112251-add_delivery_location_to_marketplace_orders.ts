import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // Destino de la entrega - se captura al crear el pedido desde el carrito ([Orden 2/8]) y se
    // usa como endRoute del viaje cuando se despacha ([Orden 5/8]); el origen es la tienda.
    await queryInterface.addColumn('marketplace_orders', 'delivery_lat', {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: null,
    })
    await queryInterface.addColumn('marketplace_orders', 'delivery_lon', {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: null,
    })
    await queryInterface.addColumn('marketplace_orders', 'delivery_address', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('marketplace_orders', 'delivery_lat')
    await queryInterface.removeColumn('marketplace_orders', 'delivery_lon')
    await queryInterface.removeColumn('marketplace_orders', 'delivery_address')
  },
}
