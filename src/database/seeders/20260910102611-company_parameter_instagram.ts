import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // URL de Instagram de DAI, para dejar de tenerla hardcodeada en payaWeb
    // (footer.component.html). El sitio publico la consume via GET
    // /api/companyParameter/all y se puede cambiar desde el admin sin redeploy.
    // Facebook, email y dominio quedan pendientes hasta tener los valores reales.
    const [vExisting]: any = await queryInterface.sequelize.query(
      `SELECT id FROM company_parameters WHERE name = 'instagramUrl' LIMIT 1`
    )
    if (vExisting.length) {
      return
    }
    await queryInterface.bulkInsert(
      'company_parameters',
      [
        {
          name: 'instagramUrl',
          value: 'https://www.instagram.com/daitraslados',
          type: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    )
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('company_parameters', { name: ['instagramUrl'] }, {})
  },
}
