import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('views', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      icon: {
        type: DataTypes.STRING,
        field: 'icon',
        allowNull: true,
        defaultValue: null,
      },
      title: {
        type: DataTypes.STRING,
        field: 'title',
        allowNull: true,
        defaultValue: null,
      },
      url: {
        type: DataTypes.STRING,
        field: 'url',
        allowNull: true,
        defaultValue: null,
      },
      route: {
        type: DataTypes.STRING,
        field: 'route',
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
        defaultValue: null,
        allowNull: true,
      },
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('views')
  },
}
