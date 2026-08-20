import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Categorias de NEGOCIO (que categorizan la tienda en si, no sus productos). Las crea el admin,
// son globales, y estan atadas a un type ('food'/'market') igual que las tiendas, para que una
// tienda food solo pueda elegir entre categorias food.
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('business_categories', {
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
      type: {
        type: DataTypes.STRING,
        field: 'type',
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
      deletedAt: {
        type: DataTypes.DATE,
        field: 'deletedAt',
        allowNull: true,
        defaultValue: null,
      },
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('business_categories')
  },
}
