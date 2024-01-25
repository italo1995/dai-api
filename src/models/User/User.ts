import { type Sequelize, type Model, type Optional, DataTypes } from 'sequelize'
import type { SequelizeAttributes, ModelStatic } from '../../types/SequelizeTypes'
import { v4 as uuidv4 } from 'uuid'
import type { ETypeUser } from '../../types/User'
import type { ModelRegistry } from '..'

export interface IUserAttributes {
  id: string
  avatar?: string
  name?: string
  email?: string
  password: string
  phoneCode: string
  phoneNumber: string
  vehicleType?: number
  dob?: Date
  status?: boolean
  isTaxi?: boolean
  isVip?: boolean
  isAc?: boolean
  availabilityToTravel?: boolean
  verifiedDriver?: boolean
  typeUser?: ETypeUser
  isNewUser?: boolean
  seats?: number
  token?: string
  tokenPush?: string
  rolId?: number
  socketId?: string
  tokenExpire?: Date
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date
}

interface IUserCreationAttributes
  extends Optional<IUserAttributes, 'id' | 'email' | 'password' | 'status'> {}

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
  avatar: {
    type: DataTypes.STRING,
    field: 'avatar',
  },
  email: {
    type: DataTypes.STRING,
    field: 'email',
    defaultValue: null,
  },
  password: {
    type: DataTypes.STRING,
    field: 'password',
    defaultValue: null,
  },
  phoneCode: {
    type: DataTypes.STRING,
    field: 'phone_code',
    unique: true,
    allowNull: true,
    set(pVal) {
      if (typeof pVal === 'number') {
        pVal = pVal.toString()
      }
      this.setDataValue('phoneNumber', pVal)
    },
  },
  phoneNumber: {
    type: DataTypes.STRING,
    field: 'phone_number',
    unique: true,
    allowNull: true,
    set(pVal) {
      console.log('pVal :>> ', typeof pVal, pVal)
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
  dob: {
    type: DataTypes.DATE,
    field: 'dob',
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
  },
}

// --> Factory....
export function fxUserFactory(sequelize: Sequelize) {
  const vUser = <ModelStatic<IUserInstance>>sequelize.define('User', vUserModelAttributes, {
    tableName: 'users',
    defaultScope: {
      attributes: {
        exclude: ['password', 'deletedAt'],
      },
      order: [['createdAt', 'DESC']],
    },
    scopes: {
      withPassword: {
        attributes: ['id', 'email', 'password'],
      },
    },
    freezeTableName: true,
    timestamps: true,
    paranoid: true,
  })

  vUser.associate = function (models: ModelRegistry) {
    const { modelUser, modelDriverDetail  } = models
    modelUser.hasMany(modelDriverDetail, {
      foreignKey: 'user_id',
      as: 'detail',
    })
  }

  vUser.prototype.toJSON = function () {
    const values = { ...this.get() }
    delete values.password
    return values
  }
  return vUser
}
