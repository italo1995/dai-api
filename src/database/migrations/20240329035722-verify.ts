import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('verify', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.STRING,
        field: 'user_id'
      },
      appeal: {
        type: DataTypes.TEXT,
        field: 'appeal',
        allowNull: true,
        defaultValue: null
      },
      reason: {
        type: DataTypes.TEXT,
        field: 'reason',
        allowNull: true,
        defaultValue: null
      },
      status: {
        type: DataTypes.INTEGER,
        field: 'status'
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
    await queryInterface.dropTable('verify')
  },
}

