import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('driver_report', {
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
      ammount: {
        type: DataTypes.FLOAT,
        field: 'ammount',
        defaultValue: null,
        allowNull: true
      },
      quantity: {
        type: DataTypes.INTEGER,
        field: 'quantity',
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
    })
  },
  async down (queryInterface: QueryInterface) {
    await queryInterface.dropTable('driver_report')
  },
}

