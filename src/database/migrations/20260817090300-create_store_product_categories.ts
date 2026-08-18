import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Tabla puente producto<->categoria. Se reemplaza por completo en cada update del producto
// (destroy + bulkCreate), no se maneja fila por fila, por eso no lleva paranoid.
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('store_product_categories', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      productId: {
        type: DataTypes.INTEGER,
        field: 'product_id',
        allowNull: false,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        field: 'category_id',
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
    await queryInterface.dropTable('store_product_categories')
  },
}
