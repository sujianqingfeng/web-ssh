import { Server } from 'http'
import { join } from 'path/posix'
import { Server as SocketServer, Socket } from 'socket.io'
import { Client, ClientChannel, ConnectConfig } from 'ssh2'
import { DOWNLOAD_COMMAND } from './constants'
import { removeAsciiEscape } from './utils'

type CommandContext = {
  line: string
  rawLine: string
  stream: ClientChannel
  command: string
  socket: Socket
  conn: Client
  streamOnData: (data: Buffer) => void
}
type CommandLineFn = (context: CommandContext) => Promise<boolean | undefined>

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

function createOnCommand({
  stream,
  socket,
  commandLineFns = [],
  streamOnData,
  conn
}: {
  stream: ClientChannel
  socket: Socket
  commandLineFns: CommandLineFn[]
  streamOnData: (data: Buffer) => void
  conn: Client
}) {
  const context: CommandContext = {
    line: '',
    rawLine: '',
    stream,
    command: '',
    socket,
    conn,
    streamOnData
  }

  return async (command: string) => {
    context.line += command
    context.rawLine += command
    context.command = command

    for (const commandLineFn of commandLineFns) {
      const state = await commandLineFn(context)

      if (state) {
        break
      }
    }

    if (command === '\x7F') {
      context.line = context.line.replace('\x7F', '').slice(0, -1)
    }

    if (command.includes('\r')) {
      context.line = ''
      context.rawLine = ''
    }

    stream.write(`${command}`)
  }
}

async function downloadCommandLine(context: CommandContext) {
  const { line, rawLine, stream, command, socket, streamOnData, conn } = context

  if (line.startsWith(`${DOWNLOAD_COMMAND} `)) {
    if (command === '\t') {
      const onD = (data: Buffer) => {
        const text = removeAsciiEscape(data.toString())
        context.line += text
        context.rawLine += text
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
        stream.off('data', streamOnData)
        const dir = await getCurrentDir(stream)
        stream.on('data', streamOnData)
        const remotePath = join(dir, path)
        const buffer = await downloadFile(conn, remotePath)
        socket.emit('download', path, buffer)
      }

      stream.write(`${command}`)

      context.line = ''
      context.rawLine = ''

      return true
    }
  }
}

function onSSHReady(socket: Socket, conn: Client) {
  console.log('Client :: ready')

  conn.shell((err, stream) => {
    if (err) {
      throw err
    }

    const onData = (data: Buffer) => {
      console.log('🚀 ~ onData ~ data:', [data.toString()])
      socket.emit('data', data)
    }

    stream
      .on('close', () => {
        conn.end()
      })
      .on('data', onData)

    socket.on(
      'command',
      createOnCommand({
        conn,
        streamOnData: onData,
        stream,
        socket,
        commandLineFns: [downloadCommandLine]
      })
    )

    socket.on('upload', async (file, name, callback) => {
      stream.off('data', onData)
      const dir = await getCurrentDir(stream)
      stream.on('data', onData)
      const remotePath = join(dir, name)
      await uploadFile(conn, file, remotePath)
      console.log('file success')

      callback && callback()
    })
  })
}

function onSSHConnection(
  socket: Socket,
  config: ConnectConfig,
  sshConnectionCallback: (data: { state: boolean; message?: string }) => void
) {
  const conn = new Client()

  conn.on('ready', () => {
    sshConnectionCallback({
      state: true
    })
    onSSHReady(socket, conn)
  })

  conn.on('error', (e) => {
    sshConnectionCallback({
      state: false,
      message: e.message
    })
  })

  socket.on('ssh-disconnect', (callback) => {
    conn.end()
    callback && callback()
  })

  socket.on('disconnect', () => {
    console.log('User disconnected')
    conn.end()
  })

  conn.connect(config)
}

export function createSocketServer(server: Server) {
  const io = new SocketServer(server, {
    path: '/ws',
    cors: {
      origin: 'http://127.0.0.1:5173/'
    }
  })

  io.on('connection', (socket) => {
    socket.on('ssh-connection', onSSHConnection.bind(null, socket))
  })
}
