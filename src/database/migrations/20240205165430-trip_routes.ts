import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('trip_routes', {
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
      isInit: {
        type: DataTypes.BOOLEAN,
        field: 'is_init',
        allowNull: true,
        defaultValue: true
      },
      isEnd: {
        type: DataTypes.BOOLEAN,
        field: 'is_end',
        allowNull: true,
        defaultValue: false
      },
      orden: {
        type: DataTypes.INTEGER,
        field: 'orden',
        allowNull: true,
        defaultValue: null
      },
      address: {
        type: DataTypes.TEXT,
        field: 'address',
        defaultValue: '',
        allowNull: true,
      },
      reference: {
        type: DataTypes.TEXT,
        field: 'reference',
        defaultValue: '',
        allowNull: true,
      },
      referencePointImage: {
        type: DataTypes.STRING,
        field: 'reference_point_image',
        defaultValue: '',
        allowNull: true,
      },
      lat: {
        type: DataTypes.DOUBLE,
        field: 'lat',
      },
      lon: {
        type: DataTypes.DOUBLE,
        field: 'lon',
      },
      // currencyId: {
      //   type: DataTypes.INTEGER,
      //   field: 'currency_id',
      // },
      userAddressId: {
        type: DataTypes.INTEGER,
        field: 'user_address_id',
        allowNull: true,
        defaultValue: null
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
        allowNull: true,
        defaultValue: null
      },
    })
  },
  async down (queryInterface: QueryInterface) {
    await queryInterface.dropTable('trip_routes')
  },
}
