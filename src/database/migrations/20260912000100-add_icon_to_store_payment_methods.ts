import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // Icono generico elegido de la libreria (media_library_items, type='payment_method').
    await queryInterface.addColumn('store_payment_methods', 'icon_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: { model: 'media_library_items', key: 'id' },
    })
    // Icono propio de esta tienda para este metodo puntual - alternativa a icon_id, no un
    // generico. Mismo flujo temp->storage que el resto de las imagenes de la API.
    await queryInterface.addColumn('store_payment_methods', 'custom_icon', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('store_payment_methods', 'icon_id')
    await queryInterface.removeColumn('store_payment_methods', 'custom_icon')
  },
}
