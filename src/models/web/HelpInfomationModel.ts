import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface IHelpinformationAttributes {
  id: string
  name: string
  description: string
  orden?: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}


interface IHelpInformationCreationAttributes extends Optional<IHelpinformationAttributes, 'id'> {}

export interface IHelpInformationInstance
  extends Model<IHelpinformationAttributes, IHelpInformationCreationAttributes>,
    IHelpinformationAttributes {}

export const vHelpInformationAttributes: SequelizeAttributes<IHelpinformationAttributes> = {
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
    type: DataTypes.TEXT,
    field: 'description',
  },
  orden: {
    type: DataTypes.TEXT,
    field: 'orden',
    allowNull: true,
    defaultValue: 0,
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
}

export function fxHelpInformationFactory(sequelize: Sequelize) {
  const vDataBase = <ModelStatic<IHelpInformationInstance>>sequelize.define(
    'HelpInformation',
    vHelpInformationAttributes,
    {
      tableName: 'help_information',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    }
  )

  vDataBase.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vDataBase
}
