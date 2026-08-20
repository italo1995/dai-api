import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Opcion dentro de un grupo de modificadores (ej: "Con todo", "Queso extra +$1.00"). extraPrice
// en 0 para las opciones incluidas sin costo (ej: "Con todo"), mayor a 0 para adicionales.
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('store_product_modifiers', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      groupId: {
        type: DataTypes.INTEGER,
        field: 'group_id',
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
    await queryInterface.dropTable('store_product_modifiers')
  },
}
