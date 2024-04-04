import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('trips', 'is_panic', {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      }),
    ])
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([queryInterface.removeColumn('trips', 'is_panic')])
  },
}
