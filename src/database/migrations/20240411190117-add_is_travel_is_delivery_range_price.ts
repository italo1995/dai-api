import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('range_prices', 'is_delivery', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      }),
      queryInterface.addColumn('range_prices', 'is_travel', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      }),
    ])
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('range_prices', 'is_delivery'),
      queryInterface.removeColumn('range_prices', 'is_travel'),
    ])
  },
}