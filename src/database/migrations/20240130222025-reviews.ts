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
        field: 'client_Id',
      },
      driverId: {
        type: DataTypes.INTEGER,
        field: 'driver_Id',
      },
      qualification: {
        type: DataTypes.INTEGER,
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
        type: DataTypes.STRING,
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
