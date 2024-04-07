import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('users', 'city_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn('users', 'region_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn('users', 'country_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      }),
    ])
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('users', 'city_id'),
      queryInterface.removeColumn('users', 'region_id'),
      queryInterface.removeColumn('users', 'country_id')
    ])
  },
}
