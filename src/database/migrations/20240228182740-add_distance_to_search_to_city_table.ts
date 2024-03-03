import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('range_prices', 'distance_to_search', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      }),
    ])
  },
  async down (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('range_prices', 'distance_to_search'),
    ])
  },
}