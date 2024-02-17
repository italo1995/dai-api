// Importamos el paquete socket.io
import { Server as webSocketServer } from 'socket.io'
import ClassAuthService from './services/User/AuthService'
import jwt from 'jsonwebtoken'
import AppConfig from './config/AppConfig'
import { modelUser } from './models'

// Creamos una clase SocketService que tendrá los métodos para inicializar y manejar el socket
export class SocketService {
  // Declaramos una propiedad estática io que contendrá el objeto io que crearemos
  static io: any

  // Creamos un método estático initSocket que recibe el servidor http y crea el objeto io
  static initSocket(httpServer: any) {
    // Creamos el objeto io con las opciones de cors
    this.io = new webSocketServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    })
    // Usamos un middleware para verificar el token del usuario y adjuntarlo al handshake
    this.io.use(async (socket: any, next: any) => {
      if (socket?.handshake?.headers?.authorization) {
        const token = socket.handshake.headers.authorization.split(' ')[1]
        socket.handshake.auth = await this.verifyTokenUser(token)
        next()
      }
      next()
    })
    // Escuchamos el evento de conexión y llamamos al método handleConnection
    this.io.on('connection', this.handleConnection)
  }

  // Creamos un método estático handleConnection que recibe el socket y maneja los eventos
  static handleConnection(socket: any) {
    // Obtenemos el usuario del handshake
    const auth = socket?.handshake?.auth || false
    const socketId = socket.id
    if (auth) {
      const user = {
        id: auth.id,
        socketId: socketId
      }
      // Actualizamos el socket del usuario en la base de datos
      ClassAuthService.updateSocket(user)
    }
    // Emitimos el evento de conexión con el socketId
    socket.emit('connection', {
      socketId
    })
    // Aquí puedes definir tus propios eventos, según lo que quieras hacer con tu socket
    // Por ejemplo:
    socket.on('join', (room: string) => {
      // Unir el socket a una sala
      socket.join(room)
      // Emitir un evento de joined a la sala
      this.io.to(room).emit('joined', room)
    })
    socket.on('leave', (room: string) => {
      // Sacar el socket de una sala
      socket.leave(room)
      // Emitir un evento de left a la sala
      this.io.to(room).emit('left', room)
    })
    socket.on('send', (msg: string) => {
      // Emitir un evento de message con el mensaje
      this.io.emit('message', msg)
    })
  }

  static async verifyTokenUser(token: string) {
    try {
      const decoded = jwt.verify(token, AppConfig.SECRET_KEY) as any
      const user = await modelUser.findByPk(decoded.id)
      if (user) {
        return user
      }
      return false
    } catch (error) {
      return false
    }
  }
}
