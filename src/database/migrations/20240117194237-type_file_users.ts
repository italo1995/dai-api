import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('type_file_users', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        field: 'name',
      },
      description: {
        type: DataTypes.STRING,
        field: 'description',
      },
      type: {
        type: DataTypes.STRING,
        field: 'type',
      },
      isVisibility: {
        type: DataTypes.BOOLEAN,
        field: 'is_visibility',
      },
      required: {
        type: DataTypes.BOOLEAN,
        field: 'required',
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
    })
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('type_file_users')
  },
}
