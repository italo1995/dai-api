// Importamos el paquete socket.io
import { Server as webSocketServer } from 'socket.io'
import ClassAuthService from './services/User/AuthService'
import jwt from 'jsonwebtoken'
import AppConfig from './config/AppConfig'
import { modelUser } from './models'
import type { EStatusDriver, IUserInstance } from './models/User/User'
import ClassTripService from './services/Trip/TripService'
import type { ITripInstance } from './models/Trip/TripModel'
import type { IResponseAllTrip } from './types/TripType'

// Creamos una clase SocketService que tendrá los métodos para inicializar y manejar el socket
export class SocketService {
  // Declaramos una propiedad estática io que contendrá el objeto io que crearemos
  static io: any
  constructor() {}
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
      console.log('socket?.handshake?.headers?.authorization :>> ', socket?.handshake?.headers?.authorization)
      if (socket?.handshake?.headers?.authorization) {
        const token = socket.handshake.headers.authorization.split(' ')[1]
        socket.handshake.auth = await this.verifyTokenUser(token)
        next()
      } else {
        console.log('no tiene', socket.id)
      }
      next()
    })
    // Escuchamos el evento de conexión y llamamos al método handleConnection
    this.io.on('connection', this.handleConnection)
  }

  // Creamos un método estático handleConnection que recibe el socket y maneja los eventos
  static async handleConnection(socket: any) {
    // Obtenemos el usuario del handshake
    let auth = socket?.handshake?.auth || false
    let user: any
    const socketId = socket.id
    if (socket.id && !auth) {
      console.log('no tiene auth :>> ', socket.id && !auth)
      auth = await SocketService.verifyTokenUser(false, socket.id)
    }
    if (auth) {
      console.log('auth?.id :>> ', auth?.id)
      console.log('auth.name :>> ', auth.dataValues?.name)
      const user = {
        id: auth?.id,
        socketId: socketId
      }
      // Actualizamos el socket del usuario en la base de datos
      await ClassAuthService.updateSocket(user)
    }
    // Emitimos el evento de conexión con el socketId
    socket.emit('connection', {
      socketId
    })
    socket.on('disconnect', async (reason: any) => {
      console.log('reason :>> ', reason)
      const vUser = {
        id: auth?.id || user?.id,
        statusDriver: 0,
        socketId: null
      }
      if (vUser?.id) {
        const vUserDB = await ClassAuthService.show(auth?.id || user.id)
        if (vUserDB?.dataValues.statusDriver === 1) {
          vUser.statusDriver = 1
        }
        await ClassAuthService.updateSocket(vUser)
      }
    })
    socket.on('reConnection', async () => {
      user = await SocketService.verifyTokenUser(false, socketId)
      auth = user
    })
    socket.on('changeState', async (pStateDriver: EStatusDriver) => {
      const vUser = {
        id: auth?.id || user.id,
        statusDriver: pStateDriver,
        socketId: socketId
      }
      if (vUser?.id) {
        await ClassAuthService.updateSocket(vUser)
      }
    })
    socket.on('coords', async (coords: any) => {
      const vUser = {
        id: auth?.id || user?.id,
        lat: coords?.lat || null,
        lon: coords?.lng || null,
        socketId: socketId
      }
      if (vUser?.id) {
        await ClassAuthService.updateSocket(vUser)
      }
      if (coords?.isDriver) {
        const vParamTripShow = {
          lat: coords?.lat || null,
          lon: coords?.lng || null,
          distance: 100
        }
        const vTripOne: IResponseAllTrip | ITripInstance[] = await ClassTripService.NearbyTrips(vParamTripShow)
        socket.emit('newTrips', vTripOne)
      }
    })
    // Aquí puedes definir tus propios eventos, según lo que quieras hacer con tu socket
    // Por ejemplo:
    // socket.on('join', (room: string) => {
    //   // Unir el socket a una sala
    //   socket.join(room)
    //   // Emitir un evento de joined a la sala
    //   this.io.to(room).emit('joined', room)
    // })
    // socket.on('leave', (room: string) => {
    //   // Sacar el socket de una sala
    //   socket.leave(room)
    //   // Emitir un evento de left a la sala
    //   this.io.to(room).emit('left', room)
    // })
    socket.on('send', (msg: string) => {
      this.io.emit('message', msg)
    })
  }

  static async verifyTokenUser(token: string | false = false, socketId: string | false = false) {
    try {
      if (token) {
        const decoded = jwt.verify(token, AppConfig.SECRET_KEY) as any
        const user: IUserInstance | null = await modelUser.findByPk(decoded.id)
        if (user) {
          return user
        }
      } else if (socketId) {
        const user: IUserInstance | null = await modelUser.findOne({
          where: {
            socketId: socketId
          }
        })
        if (user) {
          return user
        }
      }
      return null
    } catch (error) {
      return null
    }
  }
}
