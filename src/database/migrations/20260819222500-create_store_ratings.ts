import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Registro completo de cada calificacion de tienda (auditoria). El promedio/cantidad que se
// consulta normalmente vive denormalizado en stores (avg_rating/rating_count) - esta tabla es
// la fuente de verdad detras de ese numero, no hace falta leerla para mostrar el promedio.
// orderId nullable: hoy no existe el modulo de Ordenes del marketplace, se deja el campo listo
// para cuando exista (calificar solo tras una compra real), sin validarlo todavia.
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('store_ratings', {
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
      },
      userId: {
        type: DataTypes.UUID,
        field: 'user_id',
        allowNull: false,
      },
      orderId: {
        type: DataTypes.INTEGER,
        field: 'order_id',
        allowNull: true,
        defaultValue: null,
      },
      rating: {
        type: DataTypes.INTEGER,
        field: 'rating',
        allowNull: false,
        validate: {
          isInt: true,
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: DataTypes.STRING,
        field: 'comment',
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
    await queryInterface.dropTable('store_ratings')
  },
}
