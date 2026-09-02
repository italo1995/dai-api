import { DataTypes, type Model, type Optional, type Sequelize } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../types/SequelizeTypes'
import { v4 as uuidv4 } from 'uuid'

export interface IErrorReportingAttributes {
  id: string
  type?: string
  data: string
  error: string
  createdAt?: Date
  updatedAt?: Date
}
interface IErrorReportingCreationAttributes extends Optional<IErrorReportingAttributes, 'id'> {}

export interface IErrorInstance
  extends Model<IErrorReportingAttributes, IErrorReportingCreationAttributes>,
    IErrorReportingAttributes {}

//--> Model attributes
export const vErrorReportingModelAttributes: SequelizeAttributes<IErrorReportingAttributes> = {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  type: {
    type: DataTypes.STRING,
  },
  // data/error son TEXT en la migracion real (20240110132109-ErrorsReportings) - iban
  // declarados como STRING aca, desalineados con la tabla real. No rompia nada porque Sequelize
  // no valida longitud de string al hacer .create() sin validators explicitos, pero es
  // enganoso. El 'unique: true' en error tampoco existe en la migracion (nunca se aplico a la
  // DB real) - se saca porque ademas no tendria sentido: dos errores identicos (mismo mensaje +
  // stack) son un caso normal y esperado, no algo que deba fallar al guardar.
  data: {
    type: DataTypes.TEXT,
  },
  error: {
    type: DataTypes.TEXT,
  },
}
// --> Factory....
export function fxErrorReportingFactory(sequelize: Sequelize) {
  const vErrorReporting = <ModelStatic<IErrorInstance>>sequelize.define(
    'ErrorReporting',
    vErrorReportingModelAttributes,
    {
      tableName: 'error_reportings',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  vErrorReporting.prototype.toJSON = function () {
    const values = { ...this.get() }
    return values
  }
  return vErrorReporting
}
