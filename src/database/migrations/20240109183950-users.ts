import { DataTypes, type QueryInterface } from 'sequelize'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface: QueryInterface) {
    return queryInterface.createTable('users', {
      id: {
        type: DataTypes.UUID,
        field: 'id',
        primaryKey: true,
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
        allowNull: true,
      },
      phoneNumber: {
        type: DataTypes.STRING,
        field: 'phone_number',
        unique: true,
        allowNull: true,
      },
      balance: {
        type: DataTypes.INTEGER,
        field: 'balance',
        allowNull: true,
        defaultValue: null,
      },
      wallet: {
        type: DataTypes.INTEGER,
        field: 'wallet',
        allowNull: true,
        defaultValue: null,
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
        type: DataTypes.BOOLEAN,
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
    })
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('users')
  },
}
