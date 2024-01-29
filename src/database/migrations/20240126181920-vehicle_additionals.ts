import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */ 
module.exports = {
  async up (queryInterface: QueryInterface) {
    return queryInterface.createTable('driver_details', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type:DataTypes.STRING,
        field: 'name',
      },
      createdAt: {
        type:DataTypes.DATE,
        field: 'createdAt',
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: 'updatedAt',
        allowNull: false,
      }
    })
  },

  async down (queryInterface: QueryInterface) {
    await queryInterface.dropTable('vehicle_additionals')
  },
}
