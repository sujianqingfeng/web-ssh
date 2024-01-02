import { Server } from 'http'
import { Server as SocketServer } from 'socket.io'

export function createSocketServer(server: Server) {
  const io = new SocketServer(server, {
    path: '/ws',
    cors: {
      origin: 'http://127.0.0.1:5173/'
    }
  })

  io.on('connection', (socket) => {
    socket.on('disconnect', () => {
      console.log('User disconnected')
    })

    socket.on('message', (msg) => {
      io.emit('message', msg)
    })
  })
}
