import { type Sequelize, type Model, type Optional, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import { v4 as uuidv4 } from 'uuid'
import type { ETypeUser } from '../../types/User'
import { type ModelRegistry } from '..'

export interface IUserAttributes {
  id: string
  avatar?: string | null
  name?: string | null
  lastName?: string | null
  email?: string | null
  password: string
  phoneCode: string
  phoneNumber: string
  vehicleType?: number
  dob?: string
  status?: boolean
  statusDriver?: EStatusDriver
  isTaxi?: boolean
  isVip?: boolean
  isAc?: boolean
  daiFood?: boolean
  daiMarket?: boolean
  availabilityToTravel?: boolean
  verifiedDriver?: boolean
  typeUser?: ETypeUser
  isNewUser?: boolean
  seats?: number
  token?: string
  tokenPush?: string | null
  rolId?: number
  socketId?: string | null
  // Solo se usa para conductores (ver QA-03): marca cual login es el "activo" cuando la misma
  // cuenta se abre en varios dispositivos. Se fija en login(), se limpia en disconnect()
  // (logout), y se valida en cada verifyTokenUser (http y socket) contra el sessionId que viene
  // adentro del JWT - si no coinciden, el token se trata como invalido.
  activeSessionId?: string | null
  tokenExpire?: Date
  lat?: number | null
  lon?: number | null
  balance?: number | null
  driverSuspendedTo: Date | null
  staffId?: number | null
  branchId?: number | null
  cityId?: number | null
  regionId?: number | null
  countryId?: number | null
  createdAt?: Date
  updatedAt?: Date
  // '| null' explicito (a diferencia de createdAt/updatedAt) porque restore() necesita poder
  // volver a poner esto en null - el tipo generado por sequelize-cli no lo contemplaba porque
  // hasta ahora nada en el codebase revertia un soft delete.
  deletedAt?: Date | null
}
export enum EStatusDriver {
  INACTIVE = 0,
  ACTIVE = 1,
  BUSSY = 2,
}
interface IUserCreationAttributes
  extends Optional<
    IUserAttributes,
    'id' | 'email' | 'password' | 'status' | 'lat' | 'lon' | 'socketId' | 'balance'
  > {}

export interface IUserInstance
  extends Model<IUserAttributes, IUserCreationAttributes>,
    IUserAttributes {}

//--> Model attributes
export const vUserModelAttributes: SequelizeAttributes<IUserAttributes> = {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  name: {
    type: DataTypes.STRING,
    field: 'name',
  },
  lastName: {
    type: DataTypes.STRING,
    field: 'last_name',
  },
  avatar: {
    type: DataTypes.STRING,
    field: 'avatar',
  },
  email: {
    type: DataTypes.STRING,
    field: 'email',
    defaultValue: null,
    unique: true,
    validate: {
      isEmail: true,
      customValidator(value: string) {
        if (!/^[\w\\.g]+@+[\w]+[.]+[\D]{2,10}$/.test(value)) {
          throw new Error(`${value} is not a valid email!`)
        }
      },
    },
  },
  password: {
    type: DataTypes.STRING,
    field: 'password',
    defaultValue: null,
  },
  phoneCode: {
    type: DataTypes.STRING,
    field: 'phone_code',
    // unique: true,
    allowNull: true,
    set(pVal) {
      if (typeof pVal === 'number') {
        pVal = pVal.toString()
      }
      this.setDataValue('phoneCode', pVal)
    },
  },
  phoneNumber: {
    type: DataTypes.STRING,
    field: 'phone_number',
    unique: true,
    allowNull: true,
    set(pVal) {
      if (typeof pVal === 'number') {
        pVal = pVal.toString()
      }
      this.setDataValue('phoneNumber', pVal)
    },
  },
  vehicleType: {
    type: DataTypes.INTEGER,
    field: 'vehicle_type',
    allowNull: true,
    defaultValue: null,
  },
  isTaxi: {
    type: DataTypes.BOOLEAN,
    field: 'is_taxi',
    allowNull: true,
    defaultValue: false,
  },
  isVip: {
    type: DataTypes.BOOLEAN,
    field: 'is_vip',
    allowNull: true,
    defaultValue: false,
  },
  isAc: {
    type: DataTypes.BOOLEAN,
    field: 'is_ac',
    allowNull: true,
    defaultValue: false,
  },
  daiFood: {
    type: DataTypes.BOOLEAN,
    field: 'dai_food',
    allowNull: true,
    defaultValue: false,
  },
  daiMarket: {
    type: DataTypes.BOOLEAN,
    field: 'dai_market',
    allowNull: true,
    defaultValue: false,
  },
  seats: {
    type: DataTypes.INTEGER,
    field: 'seats',
    allowNull: true,
    defaultValue: null,
  },
  availabilityToTravel: {
    type: DataTypes.INTEGER,
    field: 'availability_to_travel',
    allowNull: true,
    defaultValue: false,
  },
  rolId: {
    type: DataTypes.INTEGER,
    field: 'rol_id',
    defaultValue: 3,
    allowNull: false,
    references: {
      model: {
        tableName: 'rols',
      },
      key: 'id',
    },
  },
  status: {
    type: DataTypes.BOOLEAN,
    field: 'status',
    defaultValue: true,
    allowNull: true,
  },
  statusDriver: {
    type: DataTypes.NUMBER,
    field: 'status_driver',
    allowNull: true,
    defaultValue: 1,
  },
  verifiedDriver: {
    type: DataTypes.BOOLEAN,
    field: 'verified_driver',
    defaultValue: false,
    allowNull: false,
  },
  typeUser: {
    type: DataTypes.BOOLEAN,
    field: 'type_user',
    defaultValue: '1',
    allowNull: true,
  },
  isNewUser: {
    type: DataTypes.BOOLEAN,
    field: 'is_new_user',
    defaultValue: false,
    allowNull: false,
  },
  token: {
    allowNull: true,
    type: DataTypes.STRING,
    field: 'token',
    defaultValue: null,
  },
  tokenPush: {
    allowNull: true,
    type: DataTypes.STRING,
    field: 'token_push',
    defaultValue: null,
  },
  socketId: {
    allowNull: true,
    type: DataTypes.STRING,
    field: 'socket_id',
    defaultValue: null,
  },
  activeSessionId: {
    allowNull: true,
    type: DataTypes.STRING,
    field: 'active_session_id',
    defaultValue: null,
  },
  dob: {
    type: DataTypes.STRING,
    field: 'dob',
    allowNull: true,
    defaultValue: null,
  },
  lat: {
    type: DataTypes.DOUBLE,
    field: 'lat',
    allowNull: true,
    defaultValue: null,
  },
  lon: {
    type: DataTypes.DOUBLE,
    field: 'lon',
    allowNull: true,
    defaultValue: null,
  },
  balance: {
    type: DataTypes.FLOAT,
    field: 'balance',
    allowNull: true,
    defaultValue: 0,
  },
  driverSuspendedTo: {
    type: DataTypes.DATE,
    field: 'driver_suspended_to',
    allowNull: true,
    defaultValue: null,
  },
  staffId: {
    type: DataTypes.INTEGER,
    field: 'staff_id',
    allowNull: true,
    defaultValue: null,
  },
  branchId: {
    type: DataTypes.INTEGER,
    field: 'branch_id',
    allowNull: true,
    defaultValue: null,
  },
  cityId: {
    type: DataTypes.INTEGER,
    field: 'city_id',
    defaultValue: null,
    allowNull: true,
  },
  regionId: {
    type: DataTypes.INTEGER,
    field: 'region_id',
    defaultValue: null,
    allowNull: true,
  },
  countryId: {
    type: DataTypes.INTEGER,
    field: 'country_id',
    defaultValue: null,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'createdAt',
    allowNull: true,
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updatedAt',
    allowNull: true,
  },
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deletedAt',
    allowNull: true,
    defaultValue: null,
  },
}

// --> Factory....
export function fxUserFactory(sequelize: Sequelize) {
  const vUser = <ModelStatic<IUserInstance>>sequelize.define('User', {
    ...vUserModelAttributes,
    isDriverSuspended: {
      type: DataTypes.VIRTUAL,
      get() {
        // return this.getDataValue('driver_suspended_to') > new Date()
        const driverSuspendedTo = this.getDataValue('driverSuspendedTo')
        return driverSuspendedTo ? driverSuspendedTo > new Date() : false
      },
    },
  },{
    tableName: 'users',
    defaultScope: {
      attributes: {
        exclude: ['password'],
        // include: [[sequelize.literal('CASE WHEN "driver_suspended_to" > NOW() THEN true ELSE false END'), 'isDriverSuspended']]
      },
      order: [['verifiedDriver', 'asc'], ['createdAt', 'DESC']],
    },
    scopes: {
      withPassword: {
        attributes: ['id', 'email', 'rolId', 'password', 'name', 'lastName', 'staffId'],
      },
      allAttributes: {
        attributes: ['id', 'name', 'lastName', 'avatar', 'email', 'phoneCode', 'phoneNumber', 'vehicleType', 'isTaxi', 'isVip', 'isAc', 'daiFood', 'daiMarket', 'seats', 'availabilityToTravel', 'rolId', 'status', 'statusDriver', 'verifiedDriver', 'typeUser', 'isNewUser', 'token', 'tokenPush', 'socketId', 'dob', 'lat', 'lon', 'balance', 'driverSuspendedTo', 'staffId', 'branchId', 'cityId', 'regionId', 'countryId', 'createdAt', 'updatedAt'],
      },
      isDriverSuspended: {
        attributes: [[sequelize.literal('CASE WHEN "driver_suspended_to" > NOW() THEN true ELSE false END'), 'isDriverSuspended']],
      },
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vUser.associate = function (models: ModelRegistry) {
    const { modelUser, modelDriverDetail, modelTrip, modelUserRating, modelStaff, modelVehicleType, modelBranch, modelVerify, modelSuspension, modelStore } = models
    modelUser.hasMany(modelDriverDetail, {
      foreignKey: 'user_id',
      as: 'detail',
    })
    modelUser.hasMany(modelTrip, {
      foreignKey: 'user_id',
      as: 'trip',
    })
    modelUser.hasMany(modelTrip, {
      foreignKey: 'driver_id',
      as: 'tripActive',
    })
    modelUser.hasOne(modelUserRating, {
      foreignKey: 'user_id',
      as: 'clientRating',
    })
    modelUser.hasOne(modelUserRating, {
      foreignKey: 'user_id',
      as: 'driverRating',
    })
    modelUser.hasOne(modelStaff, {
      sourceKey: 'staffId',
      foreignKey: 'id',
      as: 'staff',
    })
    modelUser.hasOne(modelBranch, {
      sourceKey: 'branchId',
      foreignKey: 'id',
      as: 'branch',
    })
    modelUser.hasOne(modelVehicleType, {
      sourceKey: 'vehicleType',
      foreignKey: 'id',
      as: 'vehicleTypeData',
    })
    modelUser.hasOne(modelVerify, {
      sourceKey: 'id',
      foreignKey: 'userId',
      as: 'verify',
    })
    modelUser.hasOne(modelSuspension, {
      sourceKey: 'id',
      foreignKey: 'driverId',
      as: 'suspension',
    })
    modelUser.hasMany(modelStore, {
      sourceKey: 'id',
      foreignKey: 'ownerId',
      as: 'stores',
    })
  }

  vUser.prototype.toJSON = function () {
    const values = { ...this.get() }
    delete values.password
    return values
  }
  return vUser
}
