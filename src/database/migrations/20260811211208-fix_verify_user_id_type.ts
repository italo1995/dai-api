import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Bug preexistente: verify.user_id se creo como character varying en vez de uuid (users.id es
// uuid), lo que rompe cualquier JOIN entre ambas tablas con "operator does not exist: uuid =
// character varying" (por ejemplo GET /api/user/all?type=driver, que hace LEFT JOIN verify).
// La tabla esta vacia al momento de esta migracion, no hay datos que castear/perder.
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE verify ALTER COLUMN user_id TYPE uuid USING user_id::uuid`
    )
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE verify ALTER COLUMN user_id TYPE character varying(255) USING user_id::character varying(255)`
    )
  },
}
