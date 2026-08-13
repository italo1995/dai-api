import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.addColumn('banners', 'is_priority', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    })
  },

  async down(queryInterface: QueryInterface) {
    return queryInterface.removeColumn('banners', 'is_priority')
  },
}
