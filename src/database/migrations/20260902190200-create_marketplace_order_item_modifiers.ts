import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('marketplace_order_item_modifiers', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      orderItemId: {
        type: DataTypes.INTEGER,
        field: 'order_item_id',
        allowNull: false,
      },
      modifierId: {
        type: DataTypes.INTEGER,
        field: 'modifier_id',
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        field: 'name',
        allowNull: false,
      },
      extraPrice: {
        type: DataTypes.DOUBLE,
        field: 'extra_price',
        allowNull: false,
        defaultValue: 0,
      },
      quantity: {
        type: DataTypes.INTEGER,
        field: 'quantity',
        allowNull: false,
        defaultValue: 1,
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
    await queryInterface.dropTable('marketplace_order_item_modifiers')
  },
}
