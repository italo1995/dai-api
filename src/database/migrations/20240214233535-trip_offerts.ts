import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('trip_offerts', {
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
      clientId: {
        type: DataTypes.UUID,
        field: 'client_id',
      },
      driverId: {
        type: DataTypes.UUID,
        field: 'driver_id',
      },
      amount: {
        type: DataTypes.STRING,
        field: 'amount',
      },
      status: {
        type: DataTypes.STRING,
        field: 'status',
        defaultValue: null,
        allowNull: true,
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
      deletedAt: {
        type: DataTypes.DATE,
        field: 'deletedAt',
        defaultValue: null,
        allowNull: true,
      },
    })
  },
  async down (queryInterface: QueryInterface) {
    await queryInterface.dropTable('trip_offerts')
  },
}
