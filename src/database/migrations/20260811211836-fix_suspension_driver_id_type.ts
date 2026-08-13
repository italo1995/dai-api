import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Mismo bug que verify.user_id (ver 20260811211208): suspension.driver_id se creo como
// character varying en vez de uuid, aunque el modelo Sequelize ya declaraba UUID - por eso el
// join con users (uuid) rompe con "operator does not exist: uuid = character varying" en
// GET /api/user/show?isDriver=true. Tabla vacia al momento de esta migracion.
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE suspension ALTER COLUMN driver_id TYPE uuid USING driver_id::uuid`
    )
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE suspension ALTER COLUMN driver_id TYPE character varying(255) USING driver_id::character varying(255)`
    )
  },
}
