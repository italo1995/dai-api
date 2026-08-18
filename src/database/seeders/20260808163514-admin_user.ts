import type { QueryInterface } from 'sequelize'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

// Credenciales de arranque para el primer login administrativo (rolId 1).
// Cambiar la contraseña desde la app apenas se entre por primera vez.
const ADMIN_EMAIL = 'admin@daitraslados.com'
const ADMIN_PASSWORD = 'DaiAdmin2026*'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    const [existing]: any = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email LIMIT 1',
      { replacements: { email: ADMIN_EMAIL } }
    )
    if (existing.length) {
      console.log(`Seeder admin_user: ya existe un usuario con email ${ADMIN_EMAIL}, se omite.`)
      return
    }

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name: 'Administrador',
        email: ADMIN_EMAIL,
        password: bcrypt.hashSync(ADMIN_PASSWORD, 10),
        rol_id: 1,
        status: true,
        verified_driver: true,
        is_new_user: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('users', { email: ADMIN_EMAIL }, {})
  },
}
