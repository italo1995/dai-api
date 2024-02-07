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
      tripId: {
        type: DataTypes.INTEGER,
        field: 'trip_id',
      },
      type: {
        type: DataTypes.STRING,
        field: 'type',
        allowNull: true,
        defaultValue: null
      },
      amount: {
        type: DataTypes.FLOAT,
        field: 'amount',
      },
      currencyId: {
        type: DataTypes.INTEGER,
        field: 'currency_id',
      },
      paymentMethodId: {
        type: DataTypes.INTEGER,
        field: 'payment_method_id',
      },
      isAprobed: {
        type: DataTypes.BOOLEAN,
        field: 'is_aprobed',
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
        allowNull: false,
      },
    })
  },
  async down (queryInterface: QueryInterface) {
    await queryInterface.dropTable('currencies')
  },
}
