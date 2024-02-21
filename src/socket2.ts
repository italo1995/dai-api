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
    io.on('connection', (socket: Socket<ServerToClientEvents, ClientToServerEvents, DefaultEventsMap>) => {
      socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`)
      })
    })
  }
}
