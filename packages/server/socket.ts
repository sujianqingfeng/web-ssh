import { Server } from 'http'
import { join } from 'path/posix'
import { Server as SocketServer } from 'socket.io'
import { Client, ClientChannel } from 'ssh2'

function getCurrentDir(stream: ClientChannel) {
  return new Promise<string>((resolve, reject) => {
    let output = ''

    const onData = (data: Buffer) => {
      const text = data.toString()
      output += text
      if (output.includes('$')) {
        const splits = output.split('\n')
        if (splits.length === 3) {
          const pathRE = /\r(.+?)\r/
          const matches = pathRE.exec(splits[1])
          if (matches && matches.length) {
            stream.off('data', onData)
            resolve(matches[1])
            return
          }
        }
        stream.off('data', onData)
        reject(new Error('Cannot get current dir'))
      }
    }
    stream.on('data', onData)

    stream.write('pwd\n')
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

    socket.on('ssh-connection', (config, sshConnectionCallback) => {
      console.log('🚀 ~ file: socket.ts:107 ~ socket.on ~ connection:')
      const conn = new Client()
      conn.on('ready', () => {
        console.log('Client :: ready')
        sshConnectionCallback()

        conn.shell((err, stream) => {
          if (err) {
            throw err
          }

          const onData = (data: Buffer) => {
            console.log(`STDOUT: ${data}`)
            socket.emit('data', data)
          }
          stream
            .on('close', () => {
              conn.end()
            })
            .on('data', onData)

          socket.on('command', async (command) => {
            console.log(
              '🚀 ~ file: socket.ts:90 ~ socket.on ~ command:',
              command
            )
            stream.write(`${command}`)
          })

          socket.on('upload', async (file, name) => {
            stream.off('data', onData)
            const dir = await getCurrentDir(stream)
            stream.on('data', onData)
            const remotePath = join(dir, name)
            await uploadFile(conn, file, remotePath)
            console.log('file success')
          })
        })

        socket.on('ssh-disconnect', (callback) => {
          conn.end()
          callback && callback()
        })
      })

      conn.connect(config)
    })
  })
}
