import * as admin from 'firebase-admin'
import path from 'path'

interface NotificationData {
  title: string
  body: string
  data?: string
}

class NotificationService {
  private messaging: admin.messaging.Messaging

  constructor() {
    const vRutaJSON = path.resolve(__dirname, '../paya-7871b-a25830197977.json')
    admin.initializeApp({
      credential: admin.credential.cert(vRutaJSON),
    })

    this.messaging = admin.messaging()
  }

  public async sendNotification(token: string[], data: NotificationData): Promise<void> {
    try {
      if (token[0]) {
        const notification = {
          token: token[0],
          notification: {
            title: data.title,
            body: data.body,
          },
          data: {
            // data: data?.data || '',
            click_action: 'FCM_PLUGIN_ACTIVITY',
          },
          android: {
            notification: {
              sound: 'default', // O especifica el nombre de un archivo de sonido personalizado
            },
          },
        }

        await this.messaging.send(notification)
      }
    } catch (error) {
      console.error('Error al enviar la notificación:', error)
    }
  }
}

export default new NotificationService()
