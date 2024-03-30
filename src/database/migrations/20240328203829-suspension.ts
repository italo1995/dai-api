import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('suspension', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      driverId: {
        type: DataTypes.STRING,
        field: 'driver_id'
      },
      reason: {
        type: DataTypes.TEXT,
        field: 'reason'
      },
      timeFrame: {
        type: DataTypes.INTEGER,
        field: 'time_frame',
      },
      init: {
        type: DataTypes.DATE,
        field: 'init',
        allowNull: false
      },
      end:{
        type: DataTypes.DATE,
        field: 'end',
        allowNull: false
      },
      hours: {
        type: DataTypes.INTEGER,
        field: 'hours',
        allowNull: true,
        defaultValue: null
      },
      isCanceled: {
        type: DataTypes.BOOLEAN,
        field: 'is_canceled',
        defaultValue: false
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
    await queryInterface.dropTable('suspension')
  },
}

