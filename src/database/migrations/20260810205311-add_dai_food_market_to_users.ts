import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn('users', 'dai_food', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    })
    await queryInterface.addColumn('users', 'dai_market', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    })
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn('users', 'dai_food')
    await queryInterface.removeColumn('users', 'dai_market')
  },
}
