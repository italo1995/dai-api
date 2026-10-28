// Cuentas de demo para la revision de Google Play (Ricardo, 2026-10-07): el revisor no puede
// recibir SMS, asi que estos dos telefonos usan siempre el codigo fijo y nunca llaman a Twilio.
// Las cuentas las crea el seeder 20261007120000-review_accounts.ts; este bypass SOLO aplica si
// el usuario ya existe (si el seeder no corrio, el login se comporta normal y manda SMS real).
export const REVIEW_VERIFICATION_CODE = '1234'
export const REVIEW_PHONE_CODE = '58'
export const REVIEW_PASSENGER_PHONE = '4240000000'
export const REVIEW_DRIVER_PHONE = '4240000001'
export const REVIEW_STORE_PHONE = '4240000002'
export const REVIEW_STORE_EMAIL = 'store@demogoogle.com'
export const REVIEW_STORE_PASSWORD = '1234567890'

const REVIEW_PHONE_NUMBERS = [REVIEW_PASSENGER_PHONE, REVIEW_DRIVER_PHONE]

export const isReviewPhoneNumber = (pPhoneNumber: string | number): boolean =>
  REVIEW_PHONE_NUMBERS.includes(String(pPhoneNumber))
