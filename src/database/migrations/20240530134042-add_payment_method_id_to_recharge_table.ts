import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('recharges', 'payment_method_id', {
        type: DataTypes.INTEGER,
        field: 'payment_method_id',
        defaultValue: null,
        allowNull: true,
      }),
    ])
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('recharges', 'payment_method_id'),
    ])
  },
}