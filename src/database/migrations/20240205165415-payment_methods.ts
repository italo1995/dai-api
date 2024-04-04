import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('payment_methods', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        field: 'name',
        allowNull: false,
      },
      fullName: {
        type: DataTypes.STRING,
        field: 'full_name',
        allowNull: true,
        defaultValue: null,
      },
      dni: {
        type: DataTypes.STRING,
        field: 'dni',
        allowNull: true,
        defaultValue: null,
      },
      tax: {
        type: DataTypes.FLOAT,
        field: 'tax',
        allowNull: true,
        defaultValue: 0,
      },
      currencyId: {
        type: DataTypes.INTEGER,
        field: 'currency_id',
        allowNull: true,
        defaultValue: null,
      },
      numberAccount: {
        type: DataTypes.STRING,
        field: 'number_account',
        allowNull: true,
        defaultValue: null,
      },
      accountType: {
        type: DataTypes.STRING,
        field: 'account_type',
        allowNull: true,
        defaultValue: null,
      },
      email: {
        type: DataTypes.STRING,
        field: 'email',
        allowNull: true,
        defaultValue: null,
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
        defaultValue: null,
      },
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('payment_methods')
  },
}
