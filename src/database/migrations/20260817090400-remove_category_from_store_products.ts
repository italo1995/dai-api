import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Reemplazado por el sistema relacional de departamentos/categorias (ver migraciones
// create_store_departments/create_store_categories/create_store_product_categories). No habia
// datos reales en produccion, solo de prueba, asi que no hace falta migrar valores.
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('store_products', 'category')
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.addColumn('store_products', 'category', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    })
  },
}
