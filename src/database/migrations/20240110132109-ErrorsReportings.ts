import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('error_reportings', {
      id: {
        type: DataTypes.UUID,
        field: 'id',
        primaryKey: true,
      },
      type: {
        type: DataTypes.STRING,
        field: 'type',
      },
      data: {
        type: DataTypes.TEXT,
        field: 'data',
      },
      error: {
        type: DataTypes.TEXT,
        field: 'error',
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
    await queryInterface.dropTable('error_reportings')
  },
}
