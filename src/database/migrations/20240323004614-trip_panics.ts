import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('trip_panics', {
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
      socketId: {
        type: DataTypes.STRING,
        field: 'socket_id',
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
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('trip_panics')
  },
}
