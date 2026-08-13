import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    const [vExisting]: any = await queryInterface.sequelize.query(
      `SELECT id FROM currencies LIMIT 1`
    )
    if (vExisting.length) {
      return
    }
    // Moneda base (type=true => se multiplica por 'change' al convertir, ver
    // CurrencyService.convert). change=1 porque es la moneda de referencia del sistema.
    await queryInterface.bulkInsert(
      'currencies',
      [
        {
          name: 'Dólar',
          symbol: '$',
          change: 1,
          type: true,
          orden: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    )
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('currencies', { name: 'Dólar' }, {})
  },
}
