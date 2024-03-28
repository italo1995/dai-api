import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('countries', 'deletedAt', {
        type: DataTypes.DATE,
        field: 'deletedAt',
        defaultValue: null,
        allowNull: true,
      }),
      queryInterface.addColumn('regions', 'deletedAt', {
        type: DataTypes.DATE,
        field: 'deletedAt',
        defaultValue: null,
        allowNull: true,
      }),
      queryInterface.addColumn('cities', 'deletedAt', {
        type: DataTypes.DATE,
        field: 'deletedAt',
        defaultValue: null,
        allowNull: true,
      })
    ])
  },
  async down (queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('countries', 'deletedAt'),
      queryInterface.removeColumn('regions', 'deletedAt'),
      queryInterface.removeColumn('cities', 'deletedAt')
    ])
  },
}