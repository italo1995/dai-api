import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // Default Venezuela (mercado base de DAI) - los paises existentes quedan asi hasta que se
    // corrija a mano; al agregar un pais nuevo conviene revisar este campo en vez de dejarlo
    // heredar el default a ciegas.
    await queryInterface.addColumn('countries', 'timezone', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'America/Caracas',
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('countries', 'timezone')
  },
}
