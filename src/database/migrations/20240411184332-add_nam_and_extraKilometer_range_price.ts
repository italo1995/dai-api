import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('range_prices', 'name', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn('range_prices', 'extra_kilometer', {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 1,
      }),
    ])
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('range_prices', 'extra_kilometer'),
      queryInterface.removeColumn('range_prices', 'name'),
    ])
  },
}