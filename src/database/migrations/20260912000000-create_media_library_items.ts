import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('media_library_items', {
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
      image: {
        type: DataTypes.STRING,
        field: 'image',
        allowNull: false,
      },
      // Texto libre a proposito - hoy solo 'payment_method', pensado para reusar esta tabla como
      // libreria de medios general mas adelante.
      type: {
        type: DataTypes.STRING,
        field: 'type',
        allowNull: false,
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
      },
    })
  },
  async down(queryInterface: QueryInterface) {
    return queryInterface.dropTable('media_library_items')
  },
}
