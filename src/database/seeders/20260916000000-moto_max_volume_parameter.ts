import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    const [vExisting]: any = await queryInterface.sequelize.query(
      `SELECT id FROM company_parameters WHERE name = 'motoMaxVolume' LIMIT 1`
    )
    if (vExisting.length) {
      return
    }
    await queryInterface.bulkInsert(
      'company_parameters',
      [
        {
          // Tope de volumen (misma unidad libre de store_products.volume) que puede llevar una
          // moto en un pedido - por encima de esto, el checkout no debe dejar elegir moto. Leido
          // por MarketplaceOrderService.checkVolume via CompanyParameterService.showByName.
          // Valor de ejemplo (QA Sprint 3 #2/#6 hablaba de 50-60-80) - ajustar desde el panel
          // admin "Parametros de la Empresa" segun lo que decida el negocio.
          name: 'motoMaxVolume',
          value: '60',
          type: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    )
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('company_parameters', { name: ['motoMaxVolume'] }, {})
  },
}
