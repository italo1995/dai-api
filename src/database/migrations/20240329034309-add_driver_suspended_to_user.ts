import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('user', 'driver_suspended_to', {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      }),
    ])
  },
  async down (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('user', 'driver_suspended_to'),
    ])
  },
}
