import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('range_prices', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      cityId: {
        type: DataTypes.INTEGER,
        field: 'city_id',
        defaultValue: null,
        allowNull: true,
      },
      regionId: {
        type: DataTypes.INTEGER,
        field: 'region_id',
        defaultValue: null,
        allowNull: true,
      },
      countryId: {
        type: DataTypes.INTEGER,
        field: 'country_id',
        defaultValue: null,
        allowNull: true,
      },
      isMoto: {
        type:DataTypes.BOOLEAN,
        field: 'is_moto',
        defaultValue: false,
        allowNull: true,
      },
      isCar: {
        type:DataTypes.BOOLEAN,
        field: 'is_car',
        defaultValue: false,
        allowNull: true,
      },
      baseKilometer: {
        type:DataTypes.DOUBLE,
        field: 'base_kilometer',
        defaultValue: 0,
        allowNull: true,
      },
      basePrice: {
        type:DataTypes.DOUBLE,
        field: 'base_price',
        defaultValue: 0,
        allowNull: true,
      },
      extraPrice: {
        type:DataTypes.DOUBLE,
        field: 'extra_price',
        defaultValue: 0,
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
      deletedAt: {
        type: DataTypes.DATE,
        field: 'deletedAt',
        defaultValue: null,
        allowNull: true,
      },
    })
  },
  async down (queryInterface: QueryInterface) {
    await queryInterface.dropTable('range_prices')
  },
}
