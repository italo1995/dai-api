import type { QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Barrido de columnas *_id con tipo real distinto al esperado, mismo patron que
// verify.user_id / suspension.driver_id / reviews.client_id+driver_id. Ninguna de estas
// esta en un include/JOIN activo hoy (solo se usan en where simples), pero quedan
// inconsistentes con lo que declaran los modelos Sequelize. Todas las tablas estaban
// vacias o con datos ya validos para el cast al momento de esta migracion:
// - driver_report (0 filas), user_addresses (0 filas), user_transaction (0 filas): vacias
// - user_codes (3 filas): user_id ya contenia UUIDs validos
// - car_data (2123 filas): parent_id era NULL en todas las filas
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE driver_report ALTER COLUMN user_id TYPE uuid USING user_id::uuid`
    )
    await queryInterface.sequelize.query(
      `ALTER TABLE user_addresses ALTER COLUMN user_id TYPE uuid USING user_id::uuid`
    )
    await queryInterface.sequelize.query(
      `ALTER TABLE user_codes ALTER COLUMN user_id TYPE uuid USING user_id::uuid`
    )
    await queryInterface.sequelize.query(
      `ALTER TABLE user_transaction ALTER COLUMN operator_id TYPE uuid USING operator_id::uuid`
    )
    await queryInterface.sequelize.query(
      `ALTER TABLE user_transaction ALTER COLUMN "userId" TYPE uuid USING NULL`
    )
    await queryInterface.sequelize.query(`ALTER TABLE car_data ALTER COLUMN parent_id DROP DEFAULT`)
    await queryInterface.sequelize.query(
      `ALTER TABLE car_data ALTER COLUMN parent_id TYPE integer USING parent_id::integer`
    )
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE driver_report ALTER COLUMN user_id TYPE character varying(255) USING user_id::character varying(255)`
    )
    await queryInterface.sequelize.query(
      `ALTER TABLE user_addresses ALTER COLUMN user_id TYPE character varying(255) USING user_id::character varying(255)`
    )
    await queryInterface.sequelize.query(
      `ALTER TABLE user_codes ALTER COLUMN user_id TYPE character varying(255) USING user_id::character varying(255)`
    )
    await queryInterface.sequelize.query(
      `ALTER TABLE user_transaction ALTER COLUMN operator_id TYPE character varying(255) USING operator_id::character varying(255)`
    )
    await queryInterface.sequelize.query(
      `ALTER TABLE user_transaction ALTER COLUMN "userId" TYPE integer USING NULL`
    )
    await queryInterface.sequelize.query(
      `ALTER TABLE car_data ALTER COLUMN parent_id TYPE character varying(255) USING parent_id::character varying(255)`
    )
  },
}
