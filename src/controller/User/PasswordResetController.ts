/*
- File: PasswordResetController.ts

- Purpose: Recuperacion de contraseña de las cuentas de tienda (rolId 4) del panel web. Pedido por
  Italo (2026-10-29): las tiendas entran con email y contraseña y no tenian forma de recuperarla
  si la olvidaban, y no hay servicio de correo configurado. La logica de tokens/codigos vive en
  PasswordResetService.ts.

==========Functions Manifest==========

1 - createLink (POST /api/admin/passwordResetLink, operador/admin): genera un enlace de
  recuperacion de un solo uso (24 h) para una tienda, por userId o storeId. Invalida los enlaces
  anteriores sin usar. El admin se lo pasa a la tienda despues de verificarla por llamada; nunca
  ve ni define la contraseña.

2 - validateLink (POST /api/auth/passwordReset/validateLink, publico): dice si un token de enlace
  sigue vigente, para mostrar o no el formulario de contraseña nueva.

3 - resetWithLink (POST /api/auth/passwordReset/link, publico): token + contraseña nueva.

4 - requestCode (POST /api/auth/passwordReset/requestCode, publico): email -> si es una tienda con
  telefono, le manda un codigo de 6 digitos por SMS. Responde SIEMPRE lo mismo, exista o no la
  cuenta, para no revelar que emails estan registrados.

5 - resetWithCode (POST /api/auth/passwordReset/code, publico): email + codigo + contraseña nueva.
 */
import type { NextFunction, Request, Response } from 'express'
import AppConfig from '../../config/AppConfig'
import ClassPasswordResetService, {
  STORE_ROL_ID,
  PASSWORD_MIN_LENGTH,
  RESET_CODE_TTL_MS,
} from '../../services/User/PasswordResetService'
import { fxSuccessResponse, fxErrorResponse, fxSendMessageTextDinamic } from '../../utils/helpers'

// Mismo mensaje para todos los casos de requestCode: email inexistente, cuenta que no es tienda,
// tienda sin telefono o codigo enviado.
const REQUEST_CODE_MESSAGE =
  'Si el correo corresponde a una tienda con teléfono registrado, te enviamos un código por SMS. ' +
  'Si no tienes teléfono registrado o no te llega el código, comunícate con soporte para recuperar tu acceso.'
const INVALID_CODE_MESSAGE = 'El código no es válido o ya venció. Solicita uno nuevo si es necesario.'
const INVALID_LINK_MESSAGE = 'El enlace no es válido, ya se usó o ya venció. Pide uno nuevo a soporte.'

// Limite simple en memoria (mismo enfoque que ErrorReportingController.createFromApp): alcanza
// con un solo proceso de pm2. Se reinicia con el proceso, lo cual esta bien para esto.
class RateLimiter {
  private _vHits = new Map<string, { since: number; count: number }>()

  constructor(private _vWindowMs: number, private _vMax: number) {
    // Limpieza periodica para que el mapa no crezca sin limite.
    setInterval(() => {
      const vNow = Date.now()
      for (const [vKey, vEntry] of this._vHits) {
        if (vNow - vEntry.since >= this._vWindowMs) this._vHits.delete(vKey)
      }
    }, this._vWindowMs).unref()
  }

  // true si la clave ya paso el maximo en la ventana actual (y cuenta este intento).
  hit(pKey: string): boolean {
    const vNow = Date.now()
    const vEntry = this._vHits.get(pKey)
    if (vEntry && vNow - vEntry.since < this._vWindowMs) {
      vEntry.count++
      return vEntry.count > this._vMax
    }
    this._vHits.set(pKey, { since: vNow, count: 1 })
    return false
  }
}

const WINDOW_MS = 15 * 60 * 1000
const vRequestByIp = new RateLimiter(WINDOW_MS, 10)
const vRequestByEmail = new RateLimiter(WINDOW_MS, 3)
const vConfirmByIp = new RateLimiter(WINDOW_MS, 20)
const vLinkByIp = new RateLimiter(WINDOW_MS, 30)

// El API corre detras del proxy del VPS (sin 'trust proxy'), asi que pReq.ip seria el mismo para
// todos: se usa la IP original que manda el proxy.
const fxClientIp = (pReq: Request): string =>
  String(pReq.headers['x-forwarded-for'] || '').split(',')[0].trim() || pReq.ip || 'unknown'

const fxTooMany = (pRes: Response) =>
  pRes.status(429).send(fxErrorResponse(429, null, 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'))

const fxValidPassword = (pPassword: any): boolean =>
  typeof pPassword === 'string' && pPassword.length >= PASSWORD_MIN_LENGTH

const PASSWORD_ERROR = `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`

class PasswordResetController {
  async createLink(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vUserId: string | undefined = pReq.input('userId')
      const vStoreId: number | undefined = pReq.input('storeId', 'number')
      if (!vUserId && !vStoreId) {
        return pRes.status(400).send(fxErrorResponse(400, null, 'userId o storeId es requerido'))
      }
      const vUser = await ClassPasswordResetService.findStoreUser({ userId: vUserId, storeId: vStoreId })
      if (!vUser) {
        return pRes.status(404).send(fxErrorResponse(404, null, 'No se encontró el usuario dueño de la tienda'))
      }
      if (Number(vUser.dataValues.rolId) !== STORE_ROL_ID) {
        return pRes
          .status(400)
          .send(fxErrorResponse(400, null, 'Solo se pueden generar enlaces para cuentas de tienda'))
      }
      const { token, expiresAt } = await ClassPasswordResetService.createLink(
        vUser.dataValues.id,
        pReq.auth?.id || null
      )
      // WEB_URL si esta configurada; si no, el origen del panel desde donde lo pide el admin (es
      // la misma app web que usan las tiendas).
      const vPath = `/recuperar/${token}`
      const vBaseUrl = String(AppConfig.WEB_URL || pReq.headers.origin || '').replace(/\/+$/, '')
      console.log(`passwordResetLink: generado por ${pReq.auth?.id} para la tienda ${vUser.dataValues.id}`)
      return pRes.status(200).send(
        fxSuccessResponse(
          200,
          {
            url: vBaseUrl ? `${vBaseUrl}${vPath}` : null,
            path: vPath,
            expiresAt,
            user: {
              id: vUser.dataValues.id,
              name: vUser.dataValues.name,
              email: vUser.dataValues.email,
            },
          },
          'Enlace generado'
        )
      )
    } catch (error) {
      pNext(error)
    }
  }

  async validateLink(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      if (vLinkByIp.hit(fxClientIp(pReq))) return fxTooMany(pRes)
      const vRow = await ClassPasswordResetService.findValidLink(String(pReq.input('token') || ''))
      if (!vRow) {
        return pRes.status(400).send(fxErrorResponse(400, { valid: false }, INVALID_LINK_MESSAGE))
      }
      // El email se muestra en el formulario: tambien sirve para la tienda que olvido su usuario.
      const vUser = await ClassPasswordResetService.findStoreUser({ userId: vRow.dataValues.userId })
      return pRes.status(200).send(
        fxSuccessResponse(
          200,
          { valid: true, email: vUser?.dataValues?.email ?? null, expiresAt: vRow.dataValues.expiresAt },
          'Enlace válido'
        )
      )
    } catch (error) {
      pNext(error)
    }
  }

  async resetWithLink(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      if (vLinkByIp.hit(fxClientIp(pReq))) return fxTooMany(pRes)
      const vPassword = pReq.body?.password
      if (!fxValidPassword(vPassword)) {
        return pRes.status(400).send(fxErrorResponse(400, null, PASSWORD_ERROR))
      }
      const vRow = await ClassPasswordResetService.findValidLink(String(pReq.input('token') || ''))
      if (!vRow) {
        return pRes.status(400).send(fxErrorResponse(400, null, INVALID_LINK_MESSAGE))
      }
      await ClassPasswordResetService.resetPassword(vRow, vPassword)
      return pRes.status(200).send(fxSuccessResponse(200, null, 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.'))
    } catch (error) {
      pNext(error)
    }
  }

  async requestCode(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      const vEmail = String(pReq.input('email') || '').trim().toLowerCase()
      if (!vEmail) {
        return pRes.status(400).send(fxErrorResponse(400, null, 'El correo es requerido'))
      }
      // Los dos limites aplican exista o no el email, asi el 429 tampoco revela nada.
      if (vRequestByIp.hit(fxClientIp(pReq)) || vRequestByEmail.hit(vEmail)) return fxTooMany(pRes)
      const vUser = await ClassPasswordResetService.findStoreUserByEmail(vEmail)
      const vPhoneCode = vUser?.dataValues?.phoneCode
      const vPhoneNumber = vUser?.dataValues?.phoneNumber
      if (vUser && vPhoneCode && vPhoneNumber && !(await ClassPasswordResetService.hasRecentCode(vUser.dataValues.id))) {
        const vCode = await ClassPasswordResetService.createCode(vUser.dataValues.id)
        // Sin await: el tiempo de respuesta no debe delatar si se mando un SMS o no.
        // fxSendMessageTextDinamic ya atrapa sus propios errores (y con TWILIO_ENABLED=false
        // solo imprime el mensaje en el log).
        void fxSendMessageTextDinamic({
          phoneCode: vPhoneCode,
          phoneNumber: vPhoneNumber,
          text: `Tu código para recuperar la contraseña de DAI es: ${vCode}. Vence en ${RESET_CODE_TTL_MS / 60000} minutos. Si no lo pediste, ignora este mensaje.`,
        })
      }
      return pRes.status(200).send(fxSuccessResponse(200, null, REQUEST_CODE_MESSAGE))
    } catch (error) {
      pNext(error)
    }
  }

  async resetWithCode(pReq: Request, pRes: Response, pNext: NextFunction) {
    try {
      if (vConfirmByIp.hit(fxClientIp(pReq))) return fxTooMany(pRes)
      const vEmail = String(pReq.input('email') || '').trim().toLowerCase()
      const vCode = String(pReq.input('code') || '')
      const vPassword = pReq.body?.password
      if (!vEmail || !vCode) {
        return pRes.status(400).send(fxErrorResponse(400, null, 'El correo y el código son requeridos'))
      }
      if (!fxValidPassword(vPassword)) {
        return pRes.status(400).send(fxErrorResponse(400, null, PASSWORD_ERROR))
      }
      const vUser = await ClassPasswordResetService.findStoreUserByEmail(vEmail)
      const vRow = vUser ? await ClassPasswordResetService.verifyCode(vUser.dataValues.id, vCode) : null
      if (!vRow) {
        return pRes.status(400).send(fxErrorResponse(400, null, INVALID_CODE_MESSAGE))
      }
      await ClassPasswordResetService.resetPassword(vRow, vPassword)
      return pRes.status(200).send(fxSuccessResponse(200, null, 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.'))
    } catch (error) {
      pNext(error)
    }
  }
}

export default new PasswordResetController()
