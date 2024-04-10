import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('trips', 'service_distance', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 0,
      }),
    ])
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('trips', 'service_distance'),
    ])
  },
}
