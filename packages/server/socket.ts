import { Server } from 'http'
import { join } from 'path/posix'
import { Server as SocketServer } from 'socket.io'
import { Client, ClientChannel } from 'ssh2'
import { DOWNLOAD_COMMAND } from './constants'
import { removeAsciiEscape } from './utils'

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

    stream.write('pwd\r')
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

function downloadFile(conn: Client, remotePath: string) {
  return new Promise<Buffer>((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) {
        reject(err)
        return
      }
      sftp.readFile(remotePath, (err, data) => {
        if (err) {
          reject(err)
          return
        }
        resolve(data)
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
      const conn = new Client()

      conn.on('ready', () => {
        console.log('Client :: ready')
        sshConnectionCallback({
          state: true
        })

        conn.shell((err, stream) => {
          if (err) {
            throw err
          }

          const onData = async (data: Buffer) => {
            console.log('🚀 ~ onData ~ data:', [data.toString()])

            socket.emit('data', data)
          }

          stream
            .on('close', () => {
              conn.end()
            })
            .on('data', onData)

          let line = ''
          let rawLine = ''
          socket.on('command', async (command) => {
            // console.log('🚀 ~ socket.on ~ command:', command)
            line += command
            rawLine += command

            if (line.startsWith(`${DOWNLOAD_COMMAND} `)) {
              if (command === '\t') {
                const onD = (data: Buffer) => {
                  const text = removeAsciiEscape(data.toString())
                  line += text
                  rawLine += text
                  stream.off('data', onD)
                }
                stream.on('data', onD)
              }

              if (command.includes('\r')) {
                const l = removeAsciiEscape(line.replace('\t', '')).trim()

                for (let i = 0; i < rawLine.length; i++) {
                  stream.write(`\x7F`)
                }

                const path = l.split(' ')[1]
                if (path) {
                  const dir = await getCurrentDir(stream)
                  stream.on('data', onData)
                  const remotePath = join(dir, path)
                  const buffer = await downloadFile(conn, remotePath)
                  socket.emit('download', buffer)
                }

                stream.write(`${command}`)

                line = ''
                rawLine = ''
                return
              }
            }

            if (command === '\x7F') {
              line = line.replace('\x7F', '').slice(0, -1)
            }

            if (command.includes('\r')) {
              line = ''
              rawLine = ''
            }
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

      conn.on('error', (e) => {
        sshConnectionCallback({
          state: false,
          message: e.message
        })
      })
      conn.connect(config)
    })
  })
}
