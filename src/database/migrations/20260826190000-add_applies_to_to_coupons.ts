import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('coupons', 'applies_to', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'purchase',
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('coupons', 'applies_to')
  },
}
