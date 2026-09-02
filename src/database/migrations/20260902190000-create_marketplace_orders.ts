import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('marketplace_orders', {
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
      },
      customerId: {
        type: DataTypes.UUID,
        field: 'customer_id',
        allowNull: false,
      },
      tripId: {
        type: DataTypes.INTEGER,
        field: 'trip_id',
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.STRING,
        field: 'status',
        allowNull: false,
        defaultValue: 'pendiente de confirmacion',
      },
      currencyId: {
        type: DataTypes.INTEGER,
        field: 'currency_id',
        allowNull: true,
        defaultValue: null,
      },
      couponId: {
        type: DataTypes.INTEGER,
        field: 'coupon_id',
        allowNull: true,
        defaultValue: null,
      },
      discount: {
        type: DataTypes.DOUBLE,
        field: 'discount',
        allowNull: false,
        defaultValue: 0,
      },
      deliveryFee: {
        type: DataTypes.DOUBLE,
        field: 'delivery_fee',
        allowNull: false,
        defaultValue: 0,
      },
      prepTimeMinutes: {
        type: DataTypes.INTEGER,
        field: 'prep_time_minutes',
        allowNull: true,
        defaultValue: null,
      },
      readyAt: {
        type: DataTypes.DATE,
        field: 'ready_at',
        allowNull: true,
        defaultValue: null,
      },
      dispatchAt: {
        type: DataTypes.DATE,
        field: 'dispatch_at',
        allowNull: true,
        defaultValue: null,
      },
      notes: {
        type: DataTypes.STRING,
        field: 'notes',
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
    await queryInterface.dropTable('marketplace_orders')
  },
}
