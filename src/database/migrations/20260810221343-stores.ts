import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('stores', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        field: 'name',
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        field: 'type',
        allowNull: false,
      },
      ownerId: {
        type: DataTypes.UUID,
        field: 'owner_id',
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      phoneCode: {
        type: DataTypes.STRING,
        field: 'phone_code',
        allowNull: true,
        defaultValue: null,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        field: 'phone_number',
        allowNull: true,
        defaultValue: null,
      },
      logo: {
        type: DataTypes.STRING,
        field: 'logo',
        allowNull: true,
        defaultValue: null,
      },
      lat: {
        type: DataTypes.DOUBLE,
        field: 'lat',
        allowNull: true,
        defaultValue: null,
      },
      lon: {
        type: DataTypes.DOUBLE,
        field: 'lon',
        allowNull: true,
        defaultValue: null,
      },
      cityId: {
        type: DataTypes.INTEGER,
        field: 'city_id',
        allowNull: true,
        defaultValue: null,
      },
      regionId: {
        type: DataTypes.INTEGER,
        field: 'region_id',
        allowNull: true,
        defaultValue: null,
      },
      countryId: {
        type: DataTypes.INTEGER,
        field: 'country_id',
        allowNull: true,
        defaultValue: null,
      },
      isOpen: {
        type: DataTypes.BOOLEAN,
        field: 'is_open',
        allowNull: true,
        defaultValue: true,
      },
      isApproved: {
        type: DataTypes.BOOLEAN,
        field: 'is_approved',
        allowNull: true,
        defaultValue: null,
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        field: 'rejection_reason',
        allowNull: true,
        defaultValue: null,
      },
      avgPrepTimeMinutes: {
        type: DataTypes.INTEGER,
        field: 'avg_prep_time_minutes',
        allowNull: true,
        defaultValue: null,
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
        defaultValue: null,
      },
    })
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('stores')
  },
}
