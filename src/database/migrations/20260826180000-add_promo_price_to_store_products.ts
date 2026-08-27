import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('store_products', 'promo_price', {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: null,
    })
    // Opcional - si no se manda, el precio promocional queda activo indefinidamente hasta que
    // se borre a mano.
    await queryInterface.addColumn('store_products', 'promo_ends_at', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('store_products', 'promo_price')
    await queryInterface.removeColumn('store_products', 'promo_ends_at')
  },
}
