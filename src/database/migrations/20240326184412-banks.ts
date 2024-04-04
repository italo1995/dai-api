import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('banks', {
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
        field: 'icon',
        defaultValue: null,
        allowNull: true,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        field: 'phone_number',
        defaultValue: null,
        allowNull: true,
      },
      accountNumber: {
        type: DataTypes.STRING,
        field: 'account_number',
        defaultValue: null,
        allowNull: true,
      },
      currencyId: {
        type: DataTypes.STRING,
        field: 'currency_id',
        defaultValue: null,
        allowNull: true,
      },
      fullName: {
        type: DataTypes.STRING,
        field: 'full_name',
      },
      dni: {
        type: DataTypes.STRING,
        field: 'dni',
      },
      accountType: {
        type: DataTypes.INTEGER,
        field: 'account_type',
      },
      email: {
        type: DataTypes.STRING,
        field: 'email',
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
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('banks')
  },
}
