import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('user_addresses', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        field: 'user_Id',
      },
      name: {
        type: DataTypes.STRING,
        field: 'name',
      },
      address: {
        type: DataTypes.TEXT,
        field: 'address',
        defaultValue: '',
        allowNull: true,
      },
      reference: {
        type: DataTypes.TEXT,
        field: 'reference',
        defaultValue: '',
        allowNull: true,
      },
      lat: {
        type: DataTypes.DOUBLE,
        field: 'lat',
      },
      lon: {
        type: DataTypes.DOUBLE,
        field: 'lon',
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

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('user_addresses')
  },
}
