import dotenv from 'dotenv'

dotenv.config()

// const env = (key: any, defaultValue=null)=>{
//     return process.env[key] || defaultValue;
// }

const AppConfig = {
  API_PREFIX: process.env.API_PREFIX,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  SOCKET_PORT: process.env.SOCKET_PORT || 3001,
  SECRET_KEY: process.env.SECRET_KEY || '',
  JWT_EXPIRES: process.env.JWT_EXPIRES || '',
  DB_USER: process.env.DB_USER || '',
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME || '',
  SQL_DIALECT: process.env.SQL_DIALECT,
  SQL_POOL_LIMIT: process.env.SQL_POOL_LIMIT,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_Token: process.env.TWILIO_AUTH_Token,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '+13158832778',
  // En false (o sin credenciales de Twilio) no se envia ningun SMS real: el mensaje se
  // imprime en la terminal y las funciones responden como si se hubiese enviado.
  TWILIO_ENABLED: process.env.TWILIO_ENABLED !== 'false',
}

export default Object.freeze(AppConfig)
