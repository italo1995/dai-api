import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Snapshot del precio unitario (producto + modificadores) en el momento en que se agrego/edito
// la seleccion de modificadores - permite avisar en el show() si el precio actual cambio desde
// entonces (subio/bajo), sin guardar un "precio congelado" real (eso sigue siendo en vivo).
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('cart_items', 'unit_price_at_add', {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: null,
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('cart_items', 'unit_price_at_add')
  },
}
