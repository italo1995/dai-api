import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('trip_delivery', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      tripId: {
        type: DataTypes.INTEGER,
        field: 'trip_id',
      },
      toSearch: {
        type: DataTypes.STRING,
        field: 'to_search',
      },
      createdAt: {
        type: DataTypes.DATE,
        field: 'createdAt',
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: 'updatedAt',
        allowNull: false,
      },
    })
  },
  async down (queryInterface: QueryInterface) {
    await queryInterface.dropTable('trip_delivery')
  },
}
