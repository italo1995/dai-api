import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    const [vExisting]: any = await queryInterface.sequelize.query(
      `SELECT id FROM vehicle_additionals LIMIT 1`
    )
    if (vExisting.length) {
      return
    }
    await queryInterface.bulkInsert(
      'vehicle_additionals',
      [
        {
          name: 'Aire acondicionado',
          icon: 'ac.svg',
          is_moto: false,
          is_car: true,
          is_client: true,
          is_register: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Acepta mascotas',
          icon: 'pet.svg',
          is_moto: true,
          is_car: true,
          is_client: true,
          is_register: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Silla para bebé',
          icon: 'baby-seat.svg',
          is_moto: false,
          is_car: true,
          is_client: true,
          is_register: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Maletero grande',
          icon: 'trunk.svg',
          is_moto: false,
          is_car: true,
          is_client: true,
          is_register: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    )
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete(
      'vehicle_additionals',
      {
        name: [
          'Aire acondicionado',
          'Acepta mascotas',
          'Silla para bebé',
          'Maletero grande',
        ],
      },
      {}
    )
  },
}
