import AppConfig from './AppConfig'

const config = {
  local: {
    username: AppConfig.DB_USER,
    password: AppConfig.DB_PASSWORD,
    database: AppConfig.DB_NAME,
    host: AppConfig.DB_HOST,
    port: AppConfig.DB_PORT,
    dialect: 'postgres',
    logging: false,
    // pool: {
    //   max: 1,
    //   min: 0,
    //   acquire: 30000,
    //   idle: 10000,
    // },
    define: {
      freezeTableName: true,
    },
  },
  development: {
    username: AppConfig.DB_USER,
    password: AppConfig.DB_PASSWORD,
    database: AppConfig.DB_NAME,
    host: AppConfig.DB_HOST,
    port: AppConfig.DB_PORT,
    dialect: 'postgres',
    logging: false,
    // pool: {
    //   max: 1,
    //   min: 0,
    //   acquire: 30000,
    //   idle: 10000,
    // },
    define: {
      freezeTableName: true,
    },
  },
  test: {
    username: AppConfig.DB_USER,
    password: AppConfig.DB_PASSWORD,
    database: AppConfig.DB_NAME,
    host: AppConfig.DB_HOST,
    dialect: 'postgres',
    logging: false,
    // pool: {
    //   max: 1,
    //   min: 0,
    //   acquire: 30000,
    //   idle: 10000,
    // },
    define: {
      freezeTableName: true,
    },
  },
  production: {
    username: AppConfig.DB_USER,
    password: AppConfig.DB_PASSWORD,
    database: AppConfig.DB_NAME,
    host: AppConfig.DB_HOST,
    dialect: 'postgres',
    logging: false,
    // pool: {
    //   max: 1,
    //   min: 0,
    //   acquire: 30000,
    //   idle: 10000,
    // },
    define: {
      freezeTableName: true,
    },
  },
}

export = Object.freeze(config)
