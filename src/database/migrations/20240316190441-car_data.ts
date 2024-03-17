import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('car_data', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        field: 'name',
        defaultValue: null,
        allowNull: true,
      },
      icon: {
        type: DataTypes.STRING,
        field: 'icon'
      },
      type: {
        type: DataTypes.INTEGER,
        field: 'type',
        allowNull: false
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
    await queryInterface.dropTable('car_data')
  },
}
