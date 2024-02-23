import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('trip_offerts', 'duration_in_ms', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      }),
    ])
  },
  async down (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('trip_offerts', 'duration_in_ms'),
    ])
  },
}