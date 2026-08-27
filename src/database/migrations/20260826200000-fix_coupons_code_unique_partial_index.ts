import { type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// coupons.code tenia un unique constraint simple que no excluye filas soft-deleted
// (paranoid: true) - una vez borrado un cupon, su codigo quedaba inutilizable para
// siempre. Lo reemplazamos por un indice unique parcial que solo mira filas activas.
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      DECLARE
        vConstraintName text;
      BEGIN
        SELECT tc.constraint_name INTO vConstraintName
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = 'coupons'
          AND tc.constraint_type = 'UNIQUE'
          AND kcu.column_name = 'code';

        IF vConstraintName IS NOT NULL THEN
          EXECUTE format('ALTER TABLE coupons DROP CONSTRAINT %I', vConstraintName);
        END IF;
      END $$;
    `)

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX coupons_code_unique_active
      ON coupons (code)
      WHERE "deletedAt" IS NULL;
    `)
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS coupons_code_unique_active;
    `)
    await queryInterface.sequelize.query(`
      ALTER TABLE coupons ADD CONSTRAINT coupons_code_key UNIQUE (code);
    `)
  },
}
