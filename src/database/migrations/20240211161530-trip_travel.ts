import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('trip_travels', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      tripId: {
        type: DataTypes.INTEGER,
        field: 'trip_id',
      },
      toSearch: {
        type: DataTypes.STRING,
        field: 'to_search',
        defaultValue: null,
        allowNull: true,
      },
      dateToInitTravel: {
        type: DataTypes.STRING,
        field: 'date_to_init_travel',
        defaultValue: null,
        allowNull: true,
      },
      howMuchPeopleToTravel: {
        type: DataTypes.INTEGER,
        field: 'how_much_people_to_travel',
        defaultValue: null,
        allowNull: true,
      },
      packageToCarry: {
        type: DataTypes.STRING,
        field: 'package_to_carry',
        defaultValue: null,
        allowNull: true,
      },
      approxWeightOfPackage: {
        type: DataTypes.INTEGER,
        field: 'approx_weight_of_package',
        defaultValue: null,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        field: 'createdAt',
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: 'updatedAt',
        allowNull: false,
      },
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('trip_travels')
  },
}
