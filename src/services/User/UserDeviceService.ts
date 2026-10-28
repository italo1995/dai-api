import { Op } from 'sequelize'
import { modelUserDevice } from '../../models'

// Multi-dispositivo (Italo, 2026-09-21): registro adicional de sockets/tokens de push por
// usuario, para que cuando la MISMA cuenta (tienda o admin) este abierta en varios dispositivos
// a la vez, a TODOS les lleguen las notificaciones y los eventos en tiempo real - antes solo le
// llegaba al ultimo que se conectaba, porque users.socket_id/token_push son un solo valor por
// cuenta y cada conexion nueva pisaba el dato del anterior sin avisar. Alcance: solo se llama
// desde los puntos que ya filtran por rolId 1/2/4 (admin/operator/tienda) - ver ws.ts y
// AuthController.ts. Las columnas viejas en "users" se siguen escribiendo igual que siempre
// (no se tocan), esta tabla es puramente aditiva.
class UserDeviceService {
  // Un socket recien conectado - se crea una fila nueva, nunca se pisa una existente (dos
  // pestañas del mismo usuario son dos filas separadas, cada una con su propio socketId).
  async registerSocket(pUserId: string, pSocketId: string): Promise<void> {
    if (!pUserId || !pSocketId) return
    await modelUserDevice.create({ userId: pUserId, socketId: pSocketId })
  }

  // Al desconectarse un socket, se borra SOLO esa fila (identificada por el socketId, que es
  // unico por conexion) - no hace falta saber de que usuario era. No-op seguro si nunca se
  // registro (sockets de driver/cliente, fuera del alcance de esta tabla).
  async removeSocket(pSocketId: string): Promise<void> {
    if (!pSocketId) return
    await modelUserDevice.destroy({ where: { socketId: pSocketId } })
  }

  // Un token de push (FCM) que este usuario registro desde algun dispositivo - a diferencia del
  // socket, este token persiste entre sesiones (no se borra al desconectar), asi que se evita
  // duplicar la fila si ese mismo dispositivo ya lo habia registrado antes.
  async registerPushToken(pUserId: string, pTokenPush: string): Promise<void> {
    if (!pUserId || !pTokenPush) return
    await modelUserDevice.findOrCreate({
      where: { userId: pUserId, tokenPush: pTokenPush },
      defaults: { userId: pUserId, tokenPush: pTokenPush },
    })
  }

  // Todas las filas de dispositivo de una lista de usuarios de una sola consulta (mas barato que
  // preguntar uno por uno) - usado por UserService.allUserAdmin() para el fan-out a admins.
  async allForUsers(pUserIds: string[]): Promise<{ userId: string; socketId: string | null; tokenPush: string | null }[]> {
    if (!pUserIds.length) return []
    const vRows = await modelUserDevice.findAll({
      where: { userId: { [Op.in]: pUserIds } },
      attributes: ['userId', 'socketId', 'tokenPush'],
    })
    return vRows.map((pRow) => ({
      userId: pRow.dataValues.userId,
      socketId: pRow.dataValues.socketId ?? null,
      tokenPush: pRow.dataValues.tokenPush ?? null,
    }))
  }

  // Todos los socketId vigentes de un usuario puntual (solo esta tabla - el llamador es quien
  // decide si tambien suma el valor viejo de users.socket_id).
  async getSocketIds(pUserId: string): Promise<string[]> {
    if (!pUserId) return []
    const vRows = await modelUserDevice.findAll({
      where: { userId: pUserId, socketId: { [Op.ne]: null } },
      attributes: ['socketId'],
    })
    return [...new Set(vRows.map((pRow) => pRow.dataValues.socketId).filter(Boolean) as string[])]
  }

  // Idem para tokens de push.
  async getPushTokens(pUserId: string): Promise<string[]> {
    if (!pUserId) return []
    const vRows = await modelUserDevice.findAll({
      where: { userId: pUserId, tokenPush: { [Op.ne]: null } },
      attributes: ['tokenPush'],
    })
    return [...new Set(vRows.map((pRow) => pRow.dataValues.tokenPush).filter(Boolean) as string[])]
  }

  // Conveniencia para los call sites que hoy solo tienen "el" socketId/tokenPush viejo de una
  // fila de usuario ya cargada (ej. vOwner.dataValues.socketId) y quieren la lista completa sin
  // tener que armar el Set a mano cada vez - suma el valor legado (si hay) con lo que haya en
  // user_devices, sin duplicar.
  async mergeSocketIds(pUserId: string, pLegacySocketId?: string | null): Promise<string[]> {
    const vDeviceIds = await this.getSocketIds(pUserId)
    return [...new Set([pLegacySocketId, ...vDeviceIds].filter(Boolean) as string[])]
  }

  async mergePushTokens(pUserId: string, pLegacyTokenPush?: string | null): Promise<string[]> {
    const vDeviceTokens = await this.getPushTokens(pUserId)
    return [...new Set([pLegacyTokenPush, ...vDeviceTokens].filter(Boolean) as string[])]
  }
}

export default new UserDeviceService()
