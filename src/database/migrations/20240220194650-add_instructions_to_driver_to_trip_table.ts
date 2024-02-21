import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('trips', 'instructions_to_driver', {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      }),
    ])
  },
  async down (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('trips', 'instructions_to_driver'),
    ])
  },
}