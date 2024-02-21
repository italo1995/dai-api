import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('users', 'status_driver', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      }),
    ])
  },
  async down (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('users', 'status_driver'),
    ])
  },
}