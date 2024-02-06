import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('currencies', {
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
      symbol: {
        type: DataTypes.STRING,
        field: 'symbol',
      },
      change: {
        type: DataTypes.FLOAT,
        field: 'change',
      },
      type: {
        type: DataTypes.BOOLEAN,
        field: 'type',
        defaultValue: true,
        allowNull: true,
      },
      auto: {
        type: DataTypes.STRING,
        field: 'auto',
        defaultValue: true,
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
        allowNull: false,
      },
    })
  },
  async down (queryInterface: QueryInterface) {
    await queryInterface.dropTable('currencies')
  },
}
