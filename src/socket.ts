import type { Socket } from 'socket.io'
import type { DefaultEventsMap } from 'socket.io/dist/typed-events'
import ClassAuthService from './services/User/AuthService'
// Puedes definir tus propios eventos aquí, según lo que quieras hacer con tu socket
interface ServerToClientEvents {
  message: (msg: string) => void
  joined: (room: string) => void
  left: (room: string) => void
  decode: any
}

interface ClientToServerEvents {
  join: (room: string) => void
  leave: (room: string) => void
  send: (msg: string) => void
}

export class SocketService {
  public static initSocket(io: any): void {
    io.on('connection', (socket: Socket<ServerToClientEvents, ClientToServerEvents, DefaultEventsMap>) => {
      const auth = socket?.handshake?.auth || false
      const socketId = socket.id
      if (auth) {
        const user = {
          id: auth.id,
          socketId: socketId
        }
        ClassAuthService.updateSocket(user)
      }
      console.log('socket.id :>> ', socket.id)
      console.log('socket.user :>> ', auth)
      io.emit('connection', {
        socketId
      })
      // io.to('room1').emit('basicEmit', 1, '2', Buffer.from([3]))
    })
  }
}