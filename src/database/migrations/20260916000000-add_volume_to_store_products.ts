import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // Volumen del producto (unidad libre, la define cada tienda/admin - ej: un tequeno pesa 5, una
    // torta 30 porque va con caja). Sirve para luego topar cuanto volumen entra en cada vehiculo
    // (QA Sprint 3 #2/#6) - esa parte del tope todavia NO esta implementada, esto es solo el dato.
    return queryInterface.addColumn('store_products', 'volume', {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: null,
    })
  },
  async down(queryInterface: QueryInterface) {
    return queryInterface.removeColumn('store_products', 'volume')
  },
}
