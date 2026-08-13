import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    const [vExisting]: any = await queryInterface.sequelize.query(
      `SELECT id FROM rols WHERE name = 'store' LIMIT 1`
    )
    if (vExisting.length) {
      return
    }
    // Se fuerza id=4 explicitamente (no se deja al autoincrement): el resto del codigo
    // (authMiddleware, StoreController) compara rolId===4 de forma hardcodeada, igual que el
    // proyecto ya hace con 1/2/3 para admin/operator/client.
    await queryInterface.bulkInsert(
      'rols',
      [
        {
          id: 4,
          name: 'store',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    )
    await queryInterface.sequelize.query(
      `SELECT setval('rols_id_seq', (SELECT MAX(id) FROM rols))`
    )
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('rols', { name: 'store' }, {})
  },
}
