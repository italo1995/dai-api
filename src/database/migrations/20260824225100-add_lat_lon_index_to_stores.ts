import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // Soporta el filtro de bounding-box de store/all?lat&lon&radiusKm: sin este indice, cada
    // busqueda por cercania hace un seq scan sobre toda la tabla de tiendas.
    await queryInterface.addIndex('stores', ['lat', 'lon'], {
      name: 'stores_lat_lon_idx',
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex('stores', 'stores_lat_lon_idx')
  },
}
