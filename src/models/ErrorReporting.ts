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
  data: {
    type: DataTypes.STRING,
  },
  error: {
    type: DataTypes.STRING,
    unique: true,
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
