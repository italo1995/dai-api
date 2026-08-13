import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    const [vExisting]: any = await queryInterface.sequelize.query(
      `SELECT id FROM vehicle_types LIMIT 1`
    )
    if (vExisting.length) {
      return
    }
    await queryInterface.bulkInsert(
      'vehicle_types',
      [
        {
          name: 'Moto',
          is_moto: true,
          is_car: false,
          orden: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Carro Económico',
          is_moto: false,
          is_car: true,
          orden: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Carro Confort',
          is_moto: false,
          is_car: true,
          orden: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    )
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete(
      'vehicle_types',
      { name: ['Moto', 'Carro Económico', 'Carro Confort'] },
      {}
    )
  },
}
