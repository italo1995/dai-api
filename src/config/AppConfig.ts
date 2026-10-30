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
  // Server-side, NO es la misma key que usa payaWeb en el navegador (esa esta restringida por
  // HTTP referrer y no sirve para llamadas server-to-server). Se usa solo para Distance Matrix
  // (calculo de delivery fee, ver MarketplaceOrderService.getQuote).
  GOOGLE_MAPS_SERVER_KEY: process.env.GOOGLE_MAPS_SERVER_KEY || '',
  // URL publica de payaWeb (sin "/" final), para armar el enlace de recuperacion de contraseña de
  // tiendas (ver PasswordResetController.createLink). Si no esta, se usa el Origin del panel admin
  // que lo pide.
  WEB_URL: process.env.WEB_URL || '',
}

export default Object.freeze(AppConfig)
