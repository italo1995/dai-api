import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Mismo bug que verify.user_id / suspension.driver_id (ver esas migraciones): reviews.client_id y
// reviews.driver_id se crearon como integer en vez de uuid, aunque el modelo Sequelize ya
// declaraba UUID - por eso el join con users (uuid) rompe con "operator does not exist:
// integer = uuid" en GET /api/review/all. Tabla vacia al momento de esta migracion.
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE reviews ALTER COLUMN client_id TYPE uuid USING client_id::text::uuid`
    )
    await queryInterface.sequelize.query(
      `ALTER TABLE reviews ALTER COLUMN driver_id TYPE uuid USING driver_id::text::uuid`
    )
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE reviews ALTER COLUMN client_id TYPE integer USING NULL`
    )
    await queryInterface.sequelize.query(
      `ALTER TABLE reviews ALTER COLUMN driver_id TYPE integer USING NULL`
    )
  },
}
