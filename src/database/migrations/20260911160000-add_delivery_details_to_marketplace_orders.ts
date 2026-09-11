import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // Que vehiculo debe usar el repartidor - lo pide la app al crear el pedido, no se infiere.
    await queryInterface.addColumn('marketplace_orders', 'vehicle', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'moto',
    })
    // Metodo de pago elegido de entre los que la tienda tiene configurados (store_payment_methods).
    await queryInterface.addColumn('marketplace_orders', 'payment_method_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: { model: 'store_payment_methods', key: 'id' },
    })
    // Punto de referencia para que el repartidor ubique la entrega (texto libre + foto opcional).
    await queryInterface.addColumn('marketplace_orders', 'reference_point_text', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    })
    await queryInterface.addColumn('marketplace_orders', 'reference_photo', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('marketplace_orders', 'vehicle')
    await queryInterface.removeColumn('marketplace_orders', 'payment_method_id')
    await queryInterface.removeColumn('marketplace_orders', 'reference_point_text')
    await queryInterface.removeColumn('marketplace_orders', 'reference_photo')
  },
}
