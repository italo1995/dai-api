import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { Op, fn, col, where as sqlWhere } from 'sequelize'
import { modelPasswordResetToken, modelUser, modelStore } from '../../models'
import type { IUserInstance } from '../../models/User/UserModel'
import type {
  IPasswordResetTokenInstance,
  TPasswordResetChannel,
} from '../../models/User/PasswordResetTokenModel'

// Recuperacion de contraseña de cuentas de tienda (rolId 4) - Italo, 2026-10-29. No hay servicio
// de correo, asi que hay dos canales:
// - 'admin_link': el admin verifica a la tienda por llamada y le genera un enlace de un solo uso
//   (24 h). El admin nunca ve ni escribe la contraseña, solo entrega el enlace.
// - 'sms': la tienda pide un codigo de 6 digitos desde el login web y le llega al telefono que
//   tiene registrado (10 min, maximo 5 intentos).
// En ambos casos se guarda solo el sha256 del secreto (ver la migracion).
export const STORE_ROL_ID = 4
export const RESET_LINK_TTL_MS = 24 * 60 * 60 * 1000
export const RESET_CODE_TTL_MS = 10 * 60 * 1000
export const RESET_CODE_MAX_ATTEMPTS = 5
// Evita reenviar otro SMS si ya se mando uno hace menos de esto (cuesta plata y molesta).
export const RESET_CODE_RESEND_COOLDOWN_MS = 60 * 1000
export const PASSWORD_MIN_LENGTH = 8

const fxSha256 = (pValue: string): string => crypto.createHash('sha256').update(pValue).digest('hex')

// El codigo SMS tiene solo 10^6 valores posibles: se mezcla con el userId antes del hash para que
// el mismo codigo de dos tiendas distintas no de el mismo hash.
const fxHashCode = (pUserId: string, pCode: string): string => fxSha256(`${pUserId}:${pCode}`)

const fxSafeEqual = (pA: string, pB: string): boolean => {
  const vA = Buffer.from(pA)
  const vB = Buffer.from(pB)
  return vA.length === vB.length && crypto.timingSafeEqual(vA, vB)
}

class PasswordResetService {
  // Busca la cuenta de tienda (no borrada) por email, sin distinguir mayusculas - la tienda puede
  // escribir su correo distinto a como lo registro.
  async findStoreUserByEmail(pEmail: string): Promise<IUserInstance | null> {
    const vEmail = String(pEmail || '').trim().toLowerCase()
    if (!vEmail) return null
    return modelUser.scope('allAttributes').findOne({
      where: {
        [Op.and]: [sqlWhere(fn('lower', col('email')), vEmail), { rolId: STORE_ROL_ID }],
      },
    })
  }

  // El admin puede pedirlo desde la ficha de la tienda (storeId -> dueño) o desde el usuario.
  async findStoreUser(pParams: { userId?: string | undefined; storeId?: number | undefined }): Promise<IUserInstance | null> {
    let vUserId = pParams.userId
    if (!vUserId && pParams.storeId) {
      const vStore = await modelStore.findOne({ where: { id: pParams.storeId }, attributes: ['id', 'ownerId'] })
      vUserId = vStore?.dataValues?.ownerId
    }
    if (!vUserId) return null
    return modelUser.scope('allAttributes').findOne({ where: { id: vUserId } })
  }

  // Deja sin efecto todo lo pendiente de un usuario (de un canal o de todos). Se usa al generar
  // uno nuevo (solo vale el ultimo) y al cambiar la contraseña (lo que quedaba del otro canal ya
  // no tiene sentido).
  async invalidatePending(pUserId: string, pChannel?: TPasswordResetChannel): Promise<void> {
    await modelPasswordResetToken.update(
      { usedAt: new Date() },
      { where: { userId: pUserId, usedAt: null, ...(pChannel ? { channel: pChannel } : {}) } }
    )
  }

  async createLink(pUserId: string, pCreatedBy: string | null): Promise<{ token: string; expiresAt: Date }> {
    await this.invalidatePending(pUserId, 'admin_link')
    // 32 bytes aleatorios en hex: no se puede adivinar, y va directo en la URL sin escapar nada.
    const vToken = crypto.randomBytes(32).toString('hex')
    const vExpiresAt = new Date(Date.now() + RESET_LINK_TTL_MS)
    await modelPasswordResetToken.create({
      userId: pUserId,
      tokenHash: fxSha256(vToken),
      channel: 'admin_link',
      expiresAt: vExpiresAt,
      createdBy: pCreatedBy,
    })
    return { token: vToken, expiresAt: vExpiresAt }
  }

  // Devuelve el registro del enlace solo si sigue vigente (existe, no usado, no vencido).
  async findValidLink(pToken: string): Promise<IPasswordResetTokenInstance | null> {
    if (!pToken || !/^[a-f0-9]{64}$/.test(pToken)) return null
    return modelPasswordResetToken.findOne({
      where: {
        tokenHash: fxSha256(pToken),
        channel: 'admin_link',
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() },
      },
    })
  }

  // Si ya hay un codigo vigente creado hace menos del cooldown, no se genera otro.
  async hasRecentCode(pUserId: string): Promise<boolean> {
    const vRecent = await modelPasswordResetToken.findOne({
      where: {
        userId: pUserId,
        channel: 'sms',
        usedAt: null,
        createdAt: { [Op.gt]: new Date(Date.now() - RESET_CODE_RESEND_COOLDOWN_MS) },
      },
    })
    return !!vRecent
  }

  async createCode(pUserId: string): Promise<string> {
    await this.invalidatePending(pUserId, 'sms')
    const vCode = crypto.randomInt(0, 1000000).toString().padStart(6, '0')
    await modelPasswordResetToken.create({
      userId: pUserId,
      tokenHash: fxHashCode(pUserId, vCode),
      channel: 'sms',
      expiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
    })
    return vCode
  }

  // Valida el codigo SMS vigente del usuario. Cada fallo suma un intento; al llegar al maximo el
  // codigo se invalida y hay que pedir otro (asi no se pueden probar los 10^6 codigos).
  async verifyCode(pUserId: string, pCode: string): Promise<IPasswordResetTokenInstance | null> {
    const vRow = await modelPasswordResetToken.findOne({
      where: { userId: pUserId, channel: 'sms', usedAt: null, expiresAt: { [Op.gt]: new Date() } },
      order: [['createdAt', 'DESC']],
    })
    if (!vRow) return null
    const vCode = String(pCode || '').trim()
    if (/^\d{6}$/.test(vCode) && fxSafeEqual(vRow.dataValues.tokenHash, fxHashCode(pUserId, vCode))) {
      return vRow
    }
    const vAttempts = (vRow.dataValues.attempts || 0) + 1
    await vRow.update({
      attempts: vAttempts,
      ...(vAttempts >= RESET_CODE_MAX_ATTEMPTS ? { usedAt: new Date() } : {}),
    })
    return null
  }

  // Cambia la contraseña con el mismo hash que registerStore/register (bcrypt, 10 rondas), marca
  // el token como usado e invalida cualquier otro pendiente de ese usuario.
  async resetPassword(pRow: IPasswordResetTokenInstance, pPassword: string): Promise<void> {
    const vUserId = pRow.dataValues.userId
    await modelUser.update({ password: bcrypt.hashSync(pPassword, 10) }, { where: { id: vUserId } })
    await pRow.update({ usedAt: new Date() })
    await this.invalidatePending(vUserId)
  }
}

export default new PasswordResetService()
