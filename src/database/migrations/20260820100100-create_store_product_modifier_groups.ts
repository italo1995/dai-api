import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
// Grupo de modificadores de un producto (ej: "¿Como la quieres?", "Elige el tipo de pan",
// "Adicionales"). required + minSelections/maxSelections definen si el cliente esta obligado a
// elegir y cuantas opciones puede marcar - las 3 columnas cubren tanto un grupo obligatorio de
// seleccion unica (required=true, min=1, max=1) como uno opcional de varias (required=false,
// min=0, max=null=sin tope).
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('store_product_modifier_groups', {
      id: {
        type: DataTypes.INTEGER,
        field: 'id',
        primaryKey: true,
        autoIncrement: true,
      },
      productId: {
        type: DataTypes.INTEGER,
        field: 'product_id',
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        field: 'name',
        allowNull: false,
      },
      required: {
        type: DataTypes.BOOLEAN,
        field: 'required',
        allowNull: false,
        defaultValue: false,
      },
      minSelections: {
        type: DataTypes.INTEGER,
        field: 'min_selections',
        allowNull: false,
        defaultValue: 0,
      },
      maxSelections: {
        type: DataTypes.INTEGER,
        field: 'max_selections',
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
    await queryInterface.dropTable('store_product_modifier_groups')
  },
}
