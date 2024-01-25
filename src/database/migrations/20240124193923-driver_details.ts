import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('driver_details', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      sectionName: {
        type: DataTypes.STRING,
        field: 'section_name',
      },
      fieldName: {
        type: DataTypes.STRING,
        field: 'field_name',
      },
      type: {
        type: DataTypes.STRING,
        field: 'type',
      },
      value: {
        type: DataTypes.TEXT,
        field: 'value',
      },
      userId: {
        type: DataTypes.STRING,
        field: 'user_id',
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
    await queryInterface.dropTable('driver_details')
  },
}
