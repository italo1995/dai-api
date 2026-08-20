import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Favorito es un toggle (agregar/quitar), no un evento a auditar como una calificacion - por eso
// no lleva paranoid, se borra la fila de verdad al quitar de favoritos.
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('store_favorites', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.UUID,
        field: 'user_id',
        allowNull: false,
      },
      storeId: {
        type: DataTypes.INTEGER,
        field: 'store_id',
        allowNull: false,
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
    await queryInterface.dropTable('store_favorites')
  },
}
