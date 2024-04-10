import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('trips', 'is_near', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      }),
      queryInterface.addColumn('trips', 'percentage', {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
      }),
    ])
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.removeColumn('trips', 'is_near'),
      queryInterface.removeColumn('trips', 'percentage')
    ])
  },
}
