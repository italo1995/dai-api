import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    const [vExisting]: any = await queryInterface.sequelize.query(
      `SELECT id FROM company_parameters LIMIT 1`
    )
    if (vExisting.length) {
      return
    }
    await queryInterface.bulkInsert(
      'company_parameters',
      [
        {
          // Porcentaje de comision de la empresa sobre cada viaje. Leido por
          // CompanyParameterService.showByName('percentage') en TripService/UserService/ws.ts
          // (si no existe, el codigo ya cae a 10 por defecto, pero mejor tenerlo explicito).
          name: 'percentage',
          value: '10',
          type: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          // Telefono de contacto/soporte que consulta la app movil via
          // GET /api/companyParameter/all?search=phoneNumber. Valor de ejemplo: reemplazar
          // por el numero real de soporte de DAI.
          name: 'phoneNumber',
          value: '584120000000',
          type: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    )
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete(
      'company_parameters',
      { name: ['percentage', 'phoneNumber'] },
      {}
    )
  },
}
