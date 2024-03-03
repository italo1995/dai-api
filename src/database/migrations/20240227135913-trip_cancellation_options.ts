import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('trip_cancellation_options', {
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
      cancellationOptionId: {
        type: DataTypes.INTEGER,
        field: 'cancellation_option_id',
        allowNull: true,
        defaultValue: null
      },
      comment: {
        type: DataTypes.STRING,
        field: 'comment',
        allowNull: true,
        defaultValue: null
      },
      userId: {
        type: DataTypes.UUID,
        field: 'user_id',
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
    await queryInterface.dropTable('trip_cancellation_options')
  },
}
