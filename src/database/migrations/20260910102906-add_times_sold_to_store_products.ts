import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // Contador de ventas del producto - estadistica siempre creciente, aparte del inventario
    // (stock_quantity). Se incrementa en cada pedido creado desde el carrito ([Orden 2/8]).
    return queryInterface.addColumn('store_products', 'times_sold', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    })
  },
  async down(queryInterface: QueryInterface) {
    return queryInterface.removeColumn('store_products', 'times_sold')
  },
}
