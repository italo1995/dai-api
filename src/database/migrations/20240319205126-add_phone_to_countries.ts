import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('countries', 'phone', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      }),
    ])
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([queryInterface.removeColumn('countries', 'phone')])
  },
}
