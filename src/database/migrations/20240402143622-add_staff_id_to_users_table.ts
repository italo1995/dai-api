import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.addColumn('users', 'staff_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      }),
    ])
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([queryInterface.removeColumn('users', 'staff_id')])
  },
}
