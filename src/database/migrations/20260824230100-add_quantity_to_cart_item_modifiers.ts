import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('cart_item_modifiers', 'quantity', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('cart_item_modifiers', 'quantity')
  },
}
