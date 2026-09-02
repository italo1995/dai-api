import { type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// RangePriceService.showPrice usa unaccent(LOWER(city.name)) en Postgres para buscar ciudades
// sin importar tildes (ej: buscar "san cristobal" matchea "San Cristóbal"). Esa funcion viene
// de la extension 'unaccent', que estaba habilitada en la base local (por eso nunca se vio el
// error ahi) pero nunca se habilito en produccion - crasheaba con "function unaccent(text) does
// not exist" en cualquier llamado a rangePrice/showPrice con filtro de ciudad.
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS unaccent;`)
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`DROP EXTENSION IF EXISTS unaccent;`)
  },
}
