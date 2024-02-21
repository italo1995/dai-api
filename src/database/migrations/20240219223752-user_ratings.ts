import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('user_ratings', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.UUID,
        field: 'user_id',
      },
      type: {
        type: DataTypes.ENUM('clientId', 'driverId'),
        field: 'type',
      },
      ratings: {
        type: DataTypes.INTEGER,
        field: 'ratings',
        validate: {
          isInt: true,
          min: 1,
          max: 5,
        },
      },
      averageRating:{
        type:DataTypes.FLOAT,
        field: 'average_rating',
      },
      quantity: {
        type: DataTypes.INTEGER,
        field: 'quantity',
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
        defaultValue: null
      },
    })
  },
  async down (queryInterface: QueryInterface) {
    await queryInterface.dropTable('user_ratings')
  },
}
