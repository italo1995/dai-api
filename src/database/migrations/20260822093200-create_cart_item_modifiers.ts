import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Bridge: modificadores seleccionados por cada item del carrito.
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('cart_item_modifiers', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      cartItemId: {
        type: DataTypes.INTEGER,
        field: 'cart_item_id',
        allowNull: false,
      },
      modifierId: {
        type: DataTypes.INTEGER,
        field: 'modifier_id',
        allowNull: false,
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
    await queryInterface.dropTable('cart_item_modifiers')
  },
}
