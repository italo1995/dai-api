import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('user_transaction', {
      id: {
        type: DataTypes.UUID,
        field: 'id',
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        field: 'userId',
      },
      operatorId: {
        type: DataTypes.STRING,
        field: 'operator_id'
      },
      amount: {
        type: DataTypes.FLOAT,
        field: 'amount'
      },
      transactionType: {
        type: DataTypes.INTEGER,
        field: 'transaction_type'
      },
      status: {
        type: DataTypes.STRING,
        field: 'status'
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
    await queryInterface.dropTable('user_transaction')
  },
}
