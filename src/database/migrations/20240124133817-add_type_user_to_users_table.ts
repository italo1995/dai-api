import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface: QueryInterface) {
    return queryInterface.addColumn('users', 'type_user', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '1',
    })
  }
}
