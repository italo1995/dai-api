import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Tabla puente tienda<->categoria de negocio. Se reemplaza por completo en cada update de la
// tienda (destroy + bulkCreate), no se maneja fila por fila, por eso no lleva paranoid.
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('store_business_categories', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      storeId: {
        type: DataTypes.INTEGER,
        field: 'store_id',
        allowNull: false,
      },
      businessCategoryId: {
        type: DataTypes.INTEGER,
        field: 'business_category_id',
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
    await queryInterface.dropTable('store_business_categories')
  },
}
