import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('currencies', 'orden', {
        type: DataTypes.INTEGER,
        field: 'orden',
        defaultValue: 0,
        allowNull: true,
      }),
    ])
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('currencies', 'orden'),
    ])
  },
}