import type { Socket } from 'socket.io'
import type { DefaultEventsMap } from 'socket.io/dist/typed-events'

// Puedes definir tus propios eventos aquí, según lo que quieras hacer con tu socket
interface ServerToClientEvents {
  message: (msg: string) => void
  joined: (room: string) => void
  left: (room: string) => void
}

interface ClientToServerEvents {
  join: (room: string) => void
  leave: (room: string) => void
  send: (msg: string) => void
}

export class SocketService {
  public static initSocket(io: any): void {
    console.log('initSocket', io)
    io.on('connection', (socket: Socket<ServerToClientEvents, ClientToServerEvents, DefaultEventsMap>) => {
      console.log('socket :>> ', socket)
      console.log(`Cliente conectado: ${socket.id}`)
      socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`)
      })
    })
  }
}
