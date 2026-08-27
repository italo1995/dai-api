import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('store_payment_methods', {
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
      // efectivo|transferencia|zelle|nequi|pago_movil|otro (ver EStorePaymentMethodType) - no es
      // el mismo catalogo global de PaymentMethod (ese es del modulo de traslados)
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // Detalle libre opcional (ej: "Banco Mercantil" para transferencia, o el nombre real
      // cuando type='otro')
      label: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
      deletedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('store_payment_methods')
  },
}
