import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('store_products', {
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
      name: {
        type: DataTypes.STRING,
        field: 'name',
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        field: 'description',
        allowNull: true,
        defaultValue: null,
      },
      price: {
        type: DataTypes.DOUBLE,
        field: 'price',
        allowNull: false,
        defaultValue: 0,
      },
      currencyId: {
        type: DataTypes.INTEGER,
        field: 'currency_id',
        allowNull: true,
        references: {
          model: 'currencies',
          key: 'id',
        },
      },
      image: {
        type: DataTypes.STRING,
        field: 'image',
        allowNull: true,
        defaultValue: null,
      },
      category: {
        type: DataTypes.STRING,
        field: 'category',
        allowNull: true,
        defaultValue: null,
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        field: 'is_available',
        allowNull: true,
        defaultValue: true,
      },
      isInventoryable: {
        type: DataTypes.BOOLEAN,
        field: 'is_inventoryable',
        allowNull: true,
        defaultValue: false,
      },
      stockQuantity: {
        type: DataTypes.INTEGER,
        field: 'stock_quantity',
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
    await queryInterface.dropTable('store_products')
  },
}
