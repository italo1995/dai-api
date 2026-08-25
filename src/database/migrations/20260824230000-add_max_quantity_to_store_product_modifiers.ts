import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // Default 1 = se comporta igual que antes (el cliente solo puede elegirlo si o no). El dueño
    // de tienda sube este numero en un modificador puntual (ej: "Queso extra") para permitir que
    // el cliente pida varias unidades de esa opcion.
    await queryInterface.addColumn('store_product_modifiers', 'max_quantity', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('store_product_modifiers', 'max_quantity')
  },
}
