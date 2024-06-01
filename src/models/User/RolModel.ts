import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import { v4 as uuidv4 } from 'uuid'

export interface rolAttributes {
  id: string
  name: string
  createdAt?: Date
  updatedAt?: Date
}
interface rolCreationAttributes extends Optional<rolAttributes, 'id'> {}

export interface RolInstance extends Model<rolAttributes, rolCreationAttributes>, rolAttributes {}

export const RolModelAttributes: SequelizeAttributes<rolAttributes> = {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
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
}

export function RolFactory(sequelize: Sequelize) {
  const Rol = <ModelStatic<RolInstance>>sequelize.define('Rol', RolModelAttributes, {
    tableName: 'rols',
    defaultScope: {
      order: [['createdAt', 'DESC']],
    },
    freezeTableName: true,
    timestamps: true,
  })

  Rol.prototype.toJSON = function () {
    const values = { ...this.get() }
    return values
  }
  return Rol
}
