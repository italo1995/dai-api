import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.bulkInsert(
      'rols',
      [
        {
          name: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'operator',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'client',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    )
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('rols', {}, {})
  },
}
