import type { QueryInterface } from 'sequelize'

const CATEGORIES: { name: string; type: string }[] = [
  { name: 'Hamburguesas', type: 'food' },
  { name: 'Pizzeria', type: 'food' },
  { name: 'Heladeria', type: 'food' },
  { name: 'Polleria', type: 'food' },
  { name: 'Supermercado', type: 'market' },
  { name: 'Papeleria', type: 'market' },
  { name: 'Farmacia', type: 'market' },
  { name: 'Ferreteria', type: 'market' },
]

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    const [existing]: any = await queryInterface.sequelize.query(
      'SELECT name FROM business_categories'
    )
    const vExistingNames = new Set(existing.map((pRow: any) => pRow.name))
    const vToInsert = CATEGORIES.filter((pCat) => !vExistingNames.has(pCat.name)).map((pCat) => ({
      ...pCat,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
    if (!vToInsert.length) {
      console.log('Seeder business_categories: ya existen todas, se omite.')
      return
    }
    await queryInterface.bulkInsert('business_categories', vToInsert)
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete(
      'business_categories',
      { name: CATEGORIES.map((pCat) => pCat.name) },
      {}
    )
  },
}
