import { Server } from 'http'
import { join } from 'path/posix'
import { Server as SocketServer } from 'socket.io'
import { Client } from 'ssh2'

function getCurrentDir(conn: Client) {
  return new Promise<string>((resolve, reject) => {
    conn.exec('pwd', (err, stream) => {
      if (err) {
        reject(err)
        return
      }
      stream
        .on('close', () => {
          // conn.end()
        })
        .on('data', (data: Buffer) => {
          const dir = data.toString().replace(/^\n+|\n+$/g, '')
          resolve(dir)
        })
        .stderr.on('data', (data) => {
          reject(data)
        })
    })
  })
}

function uploadFile(conn: Client, file: Buffer, remotePath: string) {
  return new Promise<void>((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) {
        reject(err)
        return
      }
      sftp.writeFile(remotePath, file, (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  })
}

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

    socket.on('ssh-connection', (sshConnectionCallback) => {
      const conn = new Client()
      conn.on('ready', () => {
        console.log('Client :: ready')
        sshConnectionCallback()

        conn.shell((err, stream) => {
          if (err) {
            throw err
          }

          stream
            .on('close', () => {
              console.log('Stream :: close')
              // conn.end()
            })
            .on('data', (data: any) => {
              console.log(`STDOUT: ${data}`)
              socket.emit('data', data)
            })

          socket.on('command', async (command) => {
            stream.write(`${command}`)
          })
        })

        socket.on('upload', async (file, name) => {
          const dir = await getCurrentDir(conn)
          const remotePath = join(dir, name)
          await uploadFile(conn, file, remotePath)
          console.log('file success')
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
