import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('car_data', 'is_car', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      }),
      queryInterface.addColumn('car_data', 'is_moto', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      })
    ])
  },
  async down (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('car_data', 'is_car'),
      queryInterface.removeColumn('car_data', 'is_moto')
    ])
  },
}