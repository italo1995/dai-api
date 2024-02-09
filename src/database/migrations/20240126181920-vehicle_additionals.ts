import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */ 
module.exports = {
  async up (queryInterface: QueryInterface) {
    return queryInterface.createTable('vehicle_additionals', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type:DataTypes.STRING,
        field: 'name',
      },
      icon: {
        type:DataTypes.STRING,
        field: 'image',
        defaultValue: null,
        allowNull: true,
      },
      is_moto: {
        type:DataTypes.BOOLEAN,
        field: 'is_moto',
        defaultValue: true,
        allowNull: true,
      },
      is_car: {
        type:DataTypes.BOOLEAN,
        field: 'is_car',
        defaultValue: true,
        allowNull: true,
      },
      is_client: {
        type:DataTypes.BOOLEAN,
        field: 'is_client',
        defaultValue: true,
        allowNull: true,
      },
      is_register: {
        type:DataTypes.BOOLEAN,
        field: 'is_register',
        defaultValue: true,
        allowNull: true,
      },
      createdAt: {
        type:DataTypes.DATE,
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
        allowNull: false,
      },
    })
  },

  async down (queryInterface: QueryInterface) {
    await queryInterface.dropTable('vehicle_additionals')
  },
}
