import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('recharges', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      amount: {
        type: DataTypes.FLOAT,
        field: 'amount',
      },
      countryId: {
        type: DataTypes.INTEGER,
        field: 'country_id',
      },
      currencyId: {
        type: DataTypes.INTEGER,
        field: 'currency_id',
      },
      bankId: {
        type: DataTypes.INTEGER,
        field: 'bank_id',
      },
      bank: {
        type: DataTypes.INTEGER,
        field: 'bank',
        allowNull: true,
        defaultValue: null,
      },
      capture: {
        type: DataTypes.STRING,
        field: 'capture',
        allowNull: true,
        defaultValue: null,
      },
      reference: {
        type: DataTypes.STRING,
        field: 'reference',
      },
      adminId: {
        type: DataTypes.INTEGER,
        field: 'admin_id',
      },
      status: {
        type: DataTypes.INTEGER,
        field: 'status',
      },
      reason: {
        type: DataTypes.TEXT,
        field: 'reason',
        allowNull: true,
        defaultValue: null
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
        allowNull: false
      }
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('recharges')
  },
}
