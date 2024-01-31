import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface: QueryInterface) {
  return queryInterface.createTable('Banners', {
    id: {
      type: DataTypes.INTEGER,
      field: 'id',
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      field: 'name'
    },
    image: {
      type: DataTypes.STRING,
      field: 'image'
    },
    orden: {
      type: DataTypes.INTEGER,
      field: 'orden',
      defaultValue: null,
      allowNull: true
    },
    link: {
      type: DataTypes.STRING,
      field: 'link',
      defaultValue: true,
      allowNull: true
    },
    state: {
      type: DataTypes.BOOLEAN,
      field: 'status',
      defaultValue: null,
      allowNull: true
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
      allowNull: false,
    },
  })
  },

  async down (queryInterface: QueryInterface) {
    await queryInterface.dropTable ('banners')
  },
};
