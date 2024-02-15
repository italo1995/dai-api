import jwt, { type Secret } from 'jsonwebtoken'
import * as fs from 'fs'
import imageThumbnail from 'image-thumbnail'
import twilio from 'twilio'
import AppConfig from '../config/AppConfig'
import type { IUserAttributes } from '../models/User/User'

export const fxSuccessResponse = (code: number | null = null, data: any, message: string | null = null) => {
  return {
    status: true,
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
  if (pName && fs.existsSync(`uploads/${pName}`)) {
    const vNameImages: string = pName.replace('temp', 'storage')
    fs.rename(`uploads/${pName}`, `uploads/${vNameImages}`, (err) => {
      if (err) throw err
    })
    const options: any = { width: 200, responseType: 'buffer' }
    const thumbnail = await imageThumbnail(`uploads/${vNameImages}`, options)
    const vThumbnailNameImages: string = pName.replace('temp', 'thumb')
    fs.writeFileSync(`uploads/${vThumbnailNameImages}`, thumbnail)
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
  console.log({
    body: `${pHash ? pHash : ''} Tu código de verificación es: ${vCode}`,
    from: vTwilioPhoneNumber,
    to: pPhoneNumber,
  })
  try {
    const message = await fxClient.messages.create({
      body: `${pHash ? pHash : ''} Tu código de verificación es: ${vCode}`,
      from: vTwilioPhoneNumber,
      to: pPhoneNumber,
    })
    console.log('message :>>', message.sid)
  } catch (error) {
    console.log('error :>>', error)
  }
  return vCode.toString()
}