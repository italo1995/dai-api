import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Galeria de fotos de un producto, ademas del campo image existente en store_products (que sigue
// siendo la foto de portada usada en listados - esta tabla es para fotos adicionales del detalle).
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('store_product_images', {
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
      image: {
        type: DataTypes.STRING,
        field: 'image',
        allowNull: false,
      },
      order: {
        type: DataTypes.INTEGER,
        field: 'order',
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
    await queryInterface.dropTable('store_product_images')
  },
}
