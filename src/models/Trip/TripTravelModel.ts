import { type Optional, type Sequelize, type Model, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'

export interface ITripTravelAttributes {
  id: string
  tripId: number
  toSearch?: string
  dateToInitTravel?: string
  howMuchPeopleToTravel?: number
  packageToCarry?: string
  approxWeightOfPackage?: number
  createdAt?: Date
  updatedAt?: Date
}
interface ITripTravelCreationAttributes extends Optional<ITripTravelAttributes, 'id'> {}

export interface ITripTravelInstance
  extends Model<ITripTravelAttributes, ITripTravelCreationAttributes>,
    ITripTravelAttributes {}

export const vTripTravelAttributes: SequelizeAttributes<ITripTravelAttributes> = {
  id: {
    type: DataTypes.INTEGER,
    field: 'id',
    primaryKey: true,
    autoIncrement: true,
  },
  tripId: {
    type: DataTypes.INTEGER,
    field: 'trip_id',
  },
  toSearch: {
    type: DataTypes.STRING,
    field: 'to_search',
    defaultValue: null,
    allowNull: true,
  },
  dateToInitTravel: {
    type: DataTypes.STRING,
    field: 'date_to_init_travel',
    defaultValue: null,
    allowNull: true,
  },
  howMuchPeopleToTravel: {
    type: DataTypes.INTEGER,
    field: 'how_much_people_to_travel',
    defaultValue: null,
    allowNull: true,
  },
  packageToCarry: {
    type: DataTypes.STRING,
    field: 'package_to_carry',
    defaultValue: null,
    allowNull: true,
  },
  approxWeightOfPackage: {
    type: DataTypes.INTEGER,
    field: 'approx_weight_of_package',
    defaultValue: null,
    allowNull: true,
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

export function fxTripTravelFactory(sequelize: Sequelize) {
  const vTripTravel = <ModelStatic<ITripTravelInstance>>sequelize.define(
    'Trip_travel',
    vTripTravelAttributes,
    {
      tableName: 'trip_travels',
      defaultScope: {
        order: [['createdAt', 'DESC']],
      },
      freezeTableName: true,
      timestamps: true,
    }
  )

  vTripTravel.prototype.toJSON = function () {
    const vValues = { ...this.get() }
    return vValues
  }
  return vTripTravel
}
