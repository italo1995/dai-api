import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('cancellation_options', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        field: 'name',
      },
      type: {
        type: DataTypes.INTEGER,
        field: 'type',
        allowNull: true,
        defaultValue: null,
      },
      isClient: {
        type: DataTypes.BOOLEAN,
        field: 'is_client',
        allowNull: true,
        defaultValue: false,
      },
      isDriver: {
        type: DataTypes.BOOLEAN,
        field: 'is_driver',
        allowNull: true,
        defaultValue: false,
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
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('cancellation_options')
  },
}
