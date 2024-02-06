import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('trips', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      typeService: {
        type: DataTypes.STRING,
        field: 'type_service',
      },
      userId: {
        type: DataTypes.UUID,
        field: 'user_id',
      },
      driverId: {
        type: DataTypes.UUID,
        field: 'driver_id',
      },
      date: {
        type: DataTypes.DATE,
        field: 'date',
        allowNull: true,
        defaultValue: null
      },
      status: {
        type: DataTypes.STRING,
        field: 'status',
        defaultValue: null,
        allowNull: true,
      },
      price: {
        type: DataTypes.FLOAT,
        field: 'price',
        defaultValue: null,
        allowNull: true,
      },
      currencyId: {
        type: DataTypes.NUMBER,
        field: 'currency_id'
      },
      isPayment: {
        type: DataTypes.NUMBER,
        field: 'is_payment',
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
        allowNull: false,
      },
    })
  },
  async down (queryInterface: QueryInterface) {
    await queryInterface.dropTable('trips')
  },
}
