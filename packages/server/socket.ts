import { Server } from 'http'
import { Server as SocketServer } from 'socket.io'
import { Client } from 'ssh2'

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

    socket.on('ssh-connection', () => {
      const conn = new Client()
      conn.on('ready', () => {
        console.log('Client :: ready')
        socket.emit('ssh-connection')
        conn.shell((err, stream) => {
          if (err) {
            throw err
          }
          stream
            .on('close', () => {
              console.log('Stream :: close')
              conn.end()
            })
            .on('data', (data: any) => {
              console.log(`STDOUT: ${data}`)
              socket.emit('data', data)
            })
          stream.end('ls -l\n')
        })
      })
      conn.connect({
        host: '127.0.0.1',
        port: 2222,
        username: 'dev',
        password: 'password'
      })
    })
  })
}
