import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('store_payment_methods', 'currency_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: { model: 'currencies', key: 'id' },
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('store_payment_methods', 'currency_id')
  },
}
