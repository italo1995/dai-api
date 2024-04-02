import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('trips', 'city_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn('trips', 'region_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn('trips', 'country_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      }),
    ])
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([queryInterface.removeColumn('trips', 'distance_to_search')])
  },
}
