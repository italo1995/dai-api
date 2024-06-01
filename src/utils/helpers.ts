import jwt, { type Secret } from 'jsonwebtoken'
import * as fs from 'fs'
import imageThumbnail from 'image-thumbnail'
import twilio from 'twilio'
import AppConfig from '../config/AppConfig'
import type { IUserAttributes, IUserInstance } from '../models/User/UserModel'

export const fxSuccessResponse = (
  code: number | null = null,
  data: any,
  message: string | null = null,
  status: boolean | null = true
) => {
  return {
    status: status,
    code: code || 200,
    data: data,
    message: message,
  }
}

export const fxErrorResponse = (code: number, data: any, message: string) => {
  return {
    status: false,
    code: code || 500,
    data: data,
    message: message,
  }
}

export const fxGenerateAccessToken = (user: IUserAttributes): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.rolId,
    user: user.name,
  }
  const accessToken = jwt.sign(payload, AppConfig.SECRET_KEY as Secret)
  return accessToken
}

export const fxGenerateCode = () => {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += Math.floor(Math.random() * 10)
  }
  return code
}

export const moveImages = async (pName: string): Promise<string> => {
  if (pName && pName.includes('storage')) {
    return pName
  }
  if (pName && fs.existsSync(`uploads/${pName}`)) {
    const vNameImages: string = pName.replace('temp', 'storage')
    fs.renameSync(`uploads/${pName}`, `uploads/${vNameImages}`)
    const options: any = { width: 200, responseType: 'buffer' }
    try {
      const thumbnail = await imageThumbnail(`uploads/${vNameImages}`, options)
      const vThumbnailNameImages: string = pName.replace('temp', 'thumb')
      fs.writeFileSync(`uploads/${vThumbnailNameImages}`, thumbnail)
    } catch (error) {
      return vNameImages
    }
    return vNameImages
  } else {
    const vNameImages: string = pName.replace('temp', 'storage')
    if (fs.existsSync(`uploads/${vNameImages}`)) {
      return vNameImages
    }
    return pName
  }
}

export const fxTwilioSendCode = async (
  pPhoneNumber: string,
  pCode: string | null,
  pHash: string | null
): Promise<string> => {
  const vAccountSid = AppConfig.TWILIO_ACCOUNT_SID
  const vAuthToken = AppConfig.TWILIO_AUTH_Token
  const vTwilioPhoneNumber: string = AppConfig.TWILIO_PHONE_NUMBER
  const fxClient = twilio(vAccountSid, vAuthToken)
  let vCode: string | null = pCode
  if (!vCode) {
    vCode = fxGenerateCode()
  }
  try {
    await fxClient.messages.create({
      body: `${pHash ? pHash : ''} Tu código de verificación PAYA es: ${vCode}`,
      from: vTwilioPhoneNumber,
      to: pPhoneNumber,
    })
  } catch (error) {
    throw error
  }
  return vCode.toString()
}

export const fxTwilioSendCodeRecharge = async (
  pPhoneNumber: string,
  pCode: string | null,
  pHash: string | null
): Promise<string> => {
  const vAccountSid = AppConfig.TWILIO_ACCOUNT_SID
  const vAuthToken = AppConfig.TWILIO_AUTH_Token
  const vTwilioPhoneNumber: string = AppConfig.TWILIO_PHONE_NUMBER
  const fxClient = twilio(vAccountSid, vAuthToken)
  let vCode: string | null = pCode
  if (!vCode) {
    vCode = fxGenerateCode()
  }
  try {
    await fxClient.messages.create({
      body: `${pHash ? pHash : ''} Tu código de retiro es: ${vCode}`,
      from: vTwilioPhoneNumber,
      to: pPhoneNumber,
    })
  } catch (error) {
    throw error
  }
  return vCode.toString()
}

export const fxSendMessage = async (pUser: IUserInstance): Promise<boolean | Error> => {
  const vAccountSid = AppConfig.TWILIO_ACCOUNT_SID
  const vAuthToken = AppConfig.TWILIO_AUTH_Token
  const vTwilioPhoneNumber: string = AppConfig.TWILIO_PHONE_NUMBER
  const fxClient = twilio(vAccountSid, vAuthToken)
  try {
    await fxClient.messages.create({
      body: `${pUser?.dataValues.name} Fuiste verificado como conductor en PAYA`,
      from: vTwilioPhoneNumber,
      to: `${pUser.phoneCode}${pUser.phoneNumber}`,
    })
  } catch (error) {
    throw error
  }
  return true
}

export const fxSendMessageTextDinamic = async (data: { phoneCode: string, phoneNumber: string, text: string }): Promise<boolean | Error> => {
  const vAccountSid = AppConfig.TWILIO_ACCOUNT_SID
  const vAuthToken = AppConfig.TWILIO_AUTH_Token
  const vTwilioPhoneNumber: string = AppConfig.TWILIO_PHONE_NUMBER
  const fxClient = twilio(vAccountSid, vAuthToken)
  try {
    await fxClient.messages.create({
      body: data.text,
      from: vTwilioPhoneNumber,
      to: `${data.phoneCode}${data.phoneNumber}`,
    })
  } catch (error) {
    console.log('error :>> ', error)
    // throw error
  }
  return true
}

export const sortLatLonDriver = (
  lat: number | null,
  lon: number | null
): [number, number] | [null, null] => {
  if (lat && lon) {
    const max = 0.005
    const min = -0.005
    const vRandomLon = Math.random() * (max - min) + min
    const vRandomLat = Math.random() * (max - min) + min

    const difLat = min + vRandomLat
    const difLon = min + vRandomLon
    const newLat = lat + difLat
    const newLon = lon + difLon
    return [Number(newLat.toFixed(7)), Number(newLon.toFixed(7))]
  }
  return [null, null]
}
export const withTimeout: any = (onSuccess: any, onTimeout: any, timeout: any): any => {
  let called = false
  const timer = setTimeout(() => {
    if (called) return
    called = true
    onTimeout()
  }, timeout)
  return (...args: any) => {
    if (called) return
    called = true
    clearTimeout(timer)
    onSuccess.apply(this, args)
  }
}
export const subtractTimeUnitFromCurrentDate: any = (unit: 'day' | 'week' | 'month'): string => {
  const currentDate = new Date()

  switch (unit) {
  case 'day':
    currentDate.setDate(currentDate.getDate() - 1)
    break
  case 'week':
    currentDate.setDate(currentDate.getDate() - 7)
    break
  case 'month':
    currentDate.setMonth(currentDate.getMonth() - 1)
    break
  default:
    throw new Error('Invalid time unit. Please choose "day", "week", or "month".')
  }

  // const formattedDate = currentDate.toISOString().replace('T', ' ').slice(0, 23)
  const formattedDate = `${currentDate.getFullYear()}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')}`
  return formattedDate
}