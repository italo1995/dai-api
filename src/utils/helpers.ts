import jwt, { type Secret } from 'jsonwebtoken'
import * as fs from 'fs'
import imageThumbnail from 'image-thumbnail'
import twilio from 'twilio'
import AppConfig from '../config/AppConfig'
import type { IUserAttributes, IUserInstance } from '../models/User/UserModel'
import ClassStoreService from '../services/Store/StoreService'
import type { IStoreInstance } from '../models/Store/StoreModel'

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

// Punto unico de envio de SMS. Si TWILIO_ENABLED es false, no llama a Twilio: imprime el
// mensaje en la terminal y retorna como si se hubiese enviado. Util para desarrollar sin
// credenciales de Twilio configuradas.
const fxSendSms = async (pTo: string, pBody: string): Promise<void> => {
  console.log('fxSendSms')
  try {
    if (!AppConfig.TWILIO_ENABLED) {
      console.log('----- TWILIO_ENABLED=false: SMS simulado, no se envio -----')
      console.log(`Para: ${pTo}`)
      console.log(`Mensaje: ${pBody}`)
      console.log('-------------------------------------------------------------')
      return
    }
    const vAccountSid = AppConfig.TWILIO_ACCOUNT_SID
    const vAuthToken = AppConfig.TWILIO_AUTH_Token
    const vTwilioPhoneNumber: string = AppConfig.TWILIO_PHONE_NUMBER
    const fxClient = twilio(vAccountSid, vAuthToken)
    await fxClient.messages.create({
      body: pBody,
      from: vTwilioPhoneNumber,
      to: pTo,
    })
  } catch (error) {
    console.log('fxSendSms error :>> ', error)
  }
}

export const fxTwilioSendCode = async (
  pPhoneNumber: string,
  pCode: string | null,
  pHash: string | null
): Promise<string> => {
  let vCode: string | null = pCode
  if (!vCode) {
    vCode = fxGenerateCode()
  }
  console.log('vCode :>> ', vCode)
  await fxSendSms(
    pPhoneNumber,
    `Tu código de verificación DAI es: ${vCode}\n\n${pHash ? pHash : ''} `
  )
  console.log('se envia el mensaje')
  return vCode.toString()
}

export const fxTwilioSendCodeRecharge = async (
  pPhoneNumber: string,
  pCode: string | null,
  pHash: string | null
): Promise<string> => {
  let vCode: string | null = pCode
  if (!vCode) {
    vCode = fxGenerateCode()
  }
  await fxSendSms(pPhoneNumber, `${pHash ? pHash : ''} Tu código de retiro es: ${vCode}`)
  return vCode.toString()
}

export const fxSendMessage = async (pUser: IUserInstance): Promise<boolean | Error> => {
  await fxSendSms(
    `${pUser.phoneCode}${pUser.phoneNumber}`,
    `${pUser?.dataValues.name} Fuiste verificado como conductor en DAI`
  )
  return true
}

export const fxSendMessageTextDinamic = async (data: { phoneCode: string, phoneNumber: string, text: string }): Promise<boolean | Error> => {
  try {
    await fxSendSms(`${data.phoneCode}${data.phoneNumber}`, data.text)
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
// Fisher-Yates. No muta el array recibido.
export const fxShuffleArray = <T>(pArray: T[]): T[] => {
  const vArray = [...pArray]
  for (let i = vArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[vArray[i], vArray[j]] = [vArray[j], vArray[i]]
  }
  return vArray
}

// Usados por los controllers del Marketplace (Store, StoreSchedule, StoreProduct) para
// distinguir dueño de tienda (rolId 4, solo ve/toca lo propio) de admin/operator (rolId 1/2,
// acceso total). pAuth es req.auth, ya decodeado del bearer token en server.ts.
export const fxIsStoreRole = (pAuth: any): boolean => Boolean(pAuth && Number(pAuth.rolId) === 4)
export const fxIsAdminRole = (pAuth: any): boolean =>
  Boolean(pAuth && (Number(pAuth.rolId) === 1 || Number(pAuth.rolId) === 2))

// Admin/operator pueden manejar cualquier tienda; el rol 'store' solo la propia. Usado por
// StoreProductController, StoreDepartmentController y StoreCategoryController para gatear
// create/update/delete de recursos que cuelgan de un storeId.
export async function fxCanManageStore(pAuth: any, pStoreId: number): Promise<boolean> {
  if (fxIsAdminRole(pAuth)) {
    return true
  }
  if (!fxIsStoreRole(pAuth)) {
    return false
  }
  const vStore: IStoreInstance | null = await ClassStoreService.show(pStoreId)
  return Boolean(vStore && vStore.dataValues.ownerId === pAuth.id)
}

// Precio efectivo de un producto considerando su precio promocional (StoreProduct.promoPrice) y
// vencimiento opcional (promoEndsAt). Usado tanto por StoreProductModel.toJSON (catalogo) como
// por CartService (para que el precio del carrito sea siempre el mismo numero que ve el cliente
// en el catalogo) - una sola fuente de verdad para no duplicar la comparacion de fecha.
export function fxGetProductPricing(
  pPrice: number,
  pPromoPrice?: number | null,
  pPromoEndsAt?: Date | string | null
): { finalPrice: number; isPromoActive: boolean } {
  const vIsPromoActive =
    pPromoPrice !== null &&
    pPromoPrice !== undefined &&
    (!pPromoEndsAt || new Date(pPromoEndsAt).getTime() > Date.now())
  return {
    finalPrice: vIsPromoActive ? (pPromoPrice as number) : pPrice,
    isPromoActive: vIsPromoActive,
  }
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