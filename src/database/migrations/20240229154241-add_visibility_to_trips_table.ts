import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('trips', 'visibility', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      }),
    ])
  },
  async down (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('trips', 'visibility'),
    ])
  },
}