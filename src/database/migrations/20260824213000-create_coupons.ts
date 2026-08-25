import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Cupones de plataforma (los establece DAI, no las tiendas - ver documento de requerimientos).
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('coupons', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING,
        field: 'code',
        allowNull: false,
        unique: true,
      },
      type: {
        type: DataTypes.STRING,
        field: 'type',
        allowNull: false,
      },
      value: {
        type: DataTypes.DOUBLE,
        field: 'value',
        allowNull: false,
      },
      minOrderAmount: {
        type: DataTypes.DOUBLE,
        field: 'min_order_amount',
        allowNull: true,
        defaultValue: null,
      },
      maxDiscount: {
        type: DataTypes.DOUBLE,
        field: 'max_discount',
        allowNull: true,
        defaultValue: null,
      },
      usageLimit: {
        type: DataTypes.INTEGER,
        field: 'usage_limit',
        allowNull: true,
        defaultValue: null,
      },
      usageCount: {
        type: DataTypes.INTEGER,
        field: 'usage_count',
        allowNull: false,
        defaultValue: 0,
      },
      expiresAt: {
        type: DataTypes.DATE,
        field: 'expires_at',
        allowNull: true,
        defaultValue: null,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        field: 'is_active',
        allowNull: false,
        defaultValue: true,
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
    await queryInterface.dropTable('coupons')
  },
}
