import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('vehicle_additionals', 'icon', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      }),
      queryInterface.addColumn('vehicle_additionals', 'is_moto', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      }),
      queryInterface.addColumn('vehicle_additionals', 'is_car', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      }),
      queryInterface.addColumn('vehicle_additionals', 'is_client', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      }),
      queryInterface.addColumn('vehicle_additionals', 'is_register', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      }),
    ])
  },
  async down (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('vehicle_additionals', 'icon'),
      queryInterface.removeColumn('vehicle_additionals', 'is_moto'),
      queryInterface.removeColumn('vehicle_additionals', 'is_car'),
      queryInterface.removeColumn('vehicle_additionals', 'is_client'),
      queryInterface.removeColumn('vehicle_additionals', 'is_register'),
    ])
  },
}