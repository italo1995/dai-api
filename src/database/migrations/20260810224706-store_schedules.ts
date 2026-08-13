import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('store_schedules', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      storeId: {
        type: DataTypes.INTEGER,
        field: 'store_id',
        allowNull: false,
        references: {
          model: 'stores',
          key: 'id',
        },
      },
      dayOfWeek: {
        type: DataTypes.INTEGER,
        field: 'day_of_week',
        allowNull: false,
      },
      openTime: {
        type: DataTypes.TIME,
        field: 'open_time',
        allowNull: true,
        defaultValue: null,
      },
      closeTime: {
        type: DataTypes.TIME,
        field: 'close_time',
        allowNull: true,
        defaultValue: null,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: 'is_active',
        allowNull: true,
        defaultValue: false,
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
    await queryInterface.dropTable('store_schedules')
  },
}
