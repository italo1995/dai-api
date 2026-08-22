import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    // La migracion original creo 'balance' como INTEGER, pero el modelo (UserModel.ts) siempre
    // lo declaro como FLOAT - la columna real nunca se actualizo, y guardar un balance con
    // decimales (ej: ganancias de viajes) fallaba con 'invalid input syntax for type integer'.
    await queryInterface.changeColumn('users', 'balance', {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    })
  },
  async down(queryInterface: QueryInterface) {
    await queryInterface.changeColumn('users', 'balance', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    })
  },
}
