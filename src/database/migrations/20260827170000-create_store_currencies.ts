import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('store_currencies', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'stores', key: 'id' },
      },
      currency_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'currencies', key: 'id' },
      },
      // Tasa que ESTA tienda usa para esta moneda - independiente de currencies.change (que es
      // global, del modulo de traslados). Cada comercio administra la suya propia.
      exchange_rate: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      // Una sola moneda por tienda puede ser default a la vez (se resuelve en el service, no con
      // un constraint de DB) - es la que se le muestra al cliente por defecto en esa tienda.
      is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
      deletedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    })
    // Una tienda no deberia poder agregar la misma moneda dos veces (mientras siga activa).
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX store_currencies_store_currency_unique_active
      ON store_currencies (store_id, currency_id)
      WHERE "deletedAt" IS NULL;
    `)
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('store_currencies')
  },
}
