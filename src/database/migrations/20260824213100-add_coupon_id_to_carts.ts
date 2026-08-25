import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('carts', 'coupon_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('carts', 'coupon_id')
  },
}
