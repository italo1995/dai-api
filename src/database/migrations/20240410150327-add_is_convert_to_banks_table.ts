import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('banks', 'is_convert', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      }),
    ])
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('banks', 'is_convert'),
    ])
  },
}