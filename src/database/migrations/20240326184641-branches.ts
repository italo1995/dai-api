import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('branches', {
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
      number: {
        type: DataTypes.STRING,
        field: 'number',
      },
      email: {
        type: DataTypes.STRING,
        field: 'email',
        allowNull: true,
        defaultValue: null
      },
      direction: {
        type: DataTypes.STRING,
        field: 'direction',
      },
      lat: {
        type: DataTypes.STRING,
        field: 'lat',
        allowNull: true,
        defaultValue: null
      },
      lon: {
        type: DataTypes.STRING,
        field: 'lon',
        allowNull: true,
        defaultValue: null
      },
      image: {
        type: DataTypes.STRING,
        field: 'image',
        defaultValue: null,
        allowNull: true
      },
      referencePoint: {
        type: DataTypes.STRING,
        field: 'reference_point',
        defaultValue: null,
        allowNull: true
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
    await queryInterface.dropTable('branches')
  },
}

