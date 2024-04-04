import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('users', 'lat', {
        type: DataTypes.DOUBLE,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn('users', 'lon', {
        type: DataTypes.DOUBLE,
        allowNull: true,
        defaultValue: null,
      }),
    ])
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('users', 'lat'),
      queryInterface.removeColumn('users', 'lon'),
    ])
  },
}
