import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('reviews', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        field: 'client_id',
        allowNull: true,
        defaultValue: null
      },
      driverId: {
        type: DataTypes.INTEGER,
        field: 'driver_id',
        allowNull: true,
        defaultValue: null
      },
      qualification: {
        type: DataTypes.FLOAT,
        field: 'qualification',
        validate: {
          isInt: true,
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: DataTypes.STRING,
        field: 'coment',
      },
      features: {
        type: DataTypes.BOOLEAN,
        field: 'features',
        defaultValue: false,
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
        allowNull: true,
        defaultValue: null
      },
    })
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('reviews')
  },
}
