import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('stores', 'avg_rating', {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    })
    await queryInterface.addColumn('stores', 'rating_count', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('stores', 'avg_rating')
    await queryInterface.removeColumn('stores', 'rating_count')
  },
}
