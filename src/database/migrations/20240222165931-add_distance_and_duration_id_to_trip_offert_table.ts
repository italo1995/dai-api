import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('trip_offerts', 'distance', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn('trip_offerts', 'duration', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      }),
    ])
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('trip_offerts', 'distance'),
      queryInterface.removeColumn('trip_offerts', 'duration'),
    ])
  },
}
