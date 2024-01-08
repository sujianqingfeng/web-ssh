import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import Header, { SSHConfig } from './components/Header'
import { socket } from '../../utils/socket'
import 'xterm/css/xterm.css'
import Loading from '@/components/Loading'

interface Loading {
  state: boolean
  message?: string
}

function getClipboardContent() {
  const tempElement = document.createElement('div')
  tempElement.contentEditable = true
  document.body.appendChild(tempElement)
  document.execCommand('paste')
  const clipboardContent = tempElement.innerText
  document.body.removeChild(tempElement)
  return clipboardContent
}

export default function WebSSH() {
  const xtermRef = useRef<HTMLDivElement>(null)
  const terminal = new Terminal()
  const fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)

  const [socketConnected, setSocketConnected] = useState(false)
  const [sshConnected, setSSHConnected] = useState(false)
  const [loading, setLoading] = useState<Loading>({
    state: false
  })

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    socket.emit('upload', file, file.name)
  }

  const onSSHConnection = () => {
    console.log('🚀 ~ file: index.tsx:21 ~ onSSHConnection ~ onSSHConnection:')

    xtermRef.current!.innerHTML = ''

    terminal.open(xtermRef.current!)
    fitAddon.fit()

    terminal.onKey((event) => {
      console.log('🚀 ~ file: index.tsx:73 ~ disposable ~ event:', event)
      const { domEvent, key } = event

      switch (domEvent.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          break

        default:
          socket.emit('command', key)
          break
      }
    })

    terminal.attachCustomKeyEventHandler((event) => {
      const content = getClipboardContent()
      console.log(
        '🚀 ~ file: index.tsx:71 ~ terminal.attachCustomKeyEventHandler ~ content:',
        content
      )
      // if (event.type === 'paste') {
      //   const clipboardData = (
      //     event.clipboardData || window.clipboardData
      //   ).getData('text')
      //   terminal.write(clipboardData)
      //   event.preventDefault()
      // }

      // return false
    })

    const onData = (data: Uint8Array) => {
      const text = new TextDecoder().decode(data)
      console.log('🚀 ~ file: index.tsx:60 ~ onData ~ text:', text)
      terminal.write(text)
    }

    socket.off('data')
    socket.on('data', onData)

    terminal.focus()
  }

  const onSocketConnect = (config: SSHConfig) => {
    setLoading({
      state: true,
      message: 'SSH Connecting...'
    })

    const sshConnect = () => {
      socket.emit('ssh-connection', config, () => {
        setSSHConnected(true)
        setLoading({
          state: false
        })
        onSSHConnection()
      })
    }

    if (sshConnected) {
      socket.emit('ssh-disconnect', () => {
        setSSHConnected(false)
        sshConnect()
      })
      return
    }
    sshConnect()
  }

  const onConnect = (config: SSHConfig) => {
    setLoading({
      state: true,
      message: 'Socket Connecting...'
    })
    if (socketConnected) {
      onSocketConnect(config)
      return
    }

    socket.off('connect')
    socket.once('connect', () => {
      setSocketConnected(true)
      onSocketConnect(config)
    })
  }

  useEffect(() => {
    const onDisconnect = () => {
      setSocketConnected(false)
    }

    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  return (
    <div className="h-full">
      <Header
        onFileChange={onFileChange}
        onConnect={onConnect}
        socketConnected={socketConnected}
      />
      <div className="h-full relative">
        <div className="h-full" id="terminal" ref={xtermRef}></div>

        {loading.state && (
          <div className="absolute top-0 left-0 w-full h-full bg-primary flex justify-center items-center">
            <div className="text-xl text-primary-foreground flex justify-center items-center gap-1.5">
              <Loading />
              {loading.message}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
