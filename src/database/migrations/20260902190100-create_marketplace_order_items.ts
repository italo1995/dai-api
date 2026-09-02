import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('marketplace_order_items', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: {
        type: DataTypes.INTEGER,
        field: 'order_id',
        allowNull: false,
      },
      productId: {
        type: DataTypes.INTEGER,
        field: 'product_id',
        allowNull: false,
      },
      productName: {
        type: DataTypes.STRING,
        field: 'product_name',
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        field: 'quantity',
        allowNull: false,
        defaultValue: 1,
      },
      unitPrice: {
        type: DataTypes.DOUBLE,
        field: 'unit_price',
        allowNull: false,
      },
      subtotal: {
        type: DataTypes.DOUBLE,
        field: 'subtotal',
        allowNull: false,
      },
      notes: {
        type: DataTypes.STRING,
        field: 'notes',
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
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('marketplace_order_items')
  },
}
