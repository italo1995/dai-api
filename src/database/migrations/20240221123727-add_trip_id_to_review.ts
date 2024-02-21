import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.addColumn('reviews', 'trip_id', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    })
  },
}
