import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('comments', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.STRING,
        field: 'user_id',
      },
      name: {
        type: DataTypes.STRING,
        field: 'name',
        defaultValue: null,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING,
        field: 'description'
      },
      parentId: {
        type: DataTypes.INTEGER,
        field: 'parent_id'
      },
      serviceId: {
        type: DataTypes.STRING,
        field: 'service_id'
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
    await queryInterface.dropTable('comments')
  },
}
