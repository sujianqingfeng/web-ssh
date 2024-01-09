import { useEffect, useRef, useState } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import Header, { SSHConfig } from './components/Header'
import { socket } from '../../utils/socket'
import 'xterm/css/xterm.css'
import Loading from '@/components/Loading'
import { useToast } from '@/components/ui/use-toast'

interface Loading {
  state: boolean
  message?: string
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
  const { toast } = useToast()

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
      if (event.type === 'keydown' && event.key === 'v' && event.ctrlKey) {
        navigator.clipboard.readText().then((text) => {
          socket.emit('command', text)
        })
        return false
      }
      return true
    })

    const onData = (data: Uint8Array) => {
      const text = new TextDecoder().decode(data)
      console.log('🚀 ~ file: index.tsx:60 ~ onData ~ text:', text)
      terminal.write(text)
    }

    socket.off('data')
    socket.on('data', onData)

    socket.off('download')
    socket.on('download', (data: ArrayBuffer) => {
      console.log('🚀 ~ socket.on ~ data:', data)
      const blob = new Blob([data], { type: 'application/octet-stream' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'downloaded-file.txt'
      link.click()
    })

    terminal.focus()
  }

  const onSocketConnect = (config: SSHConfig) => {
    setLoading({
      state: true,
      message: 'SSH Connecting...'
    })

    const sshConnect = () => {
      socket.emit(
        'ssh-connection',
        config,
        ({ state, message }: { state: boolean; message?: string }) => {
          if (!state) {
            setSSHConnected(false)
            toast({
              title: 'Error',
              description: message,
              variant: 'destructive'
            })
            return
          }
          setSSHConnected(true)
          setLoading({
            state: false
          })
          onSSHConnection()
        }
      )
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
        <div className="h-full" id="terminal" ref={xtermRef}>
          dd
        </div>

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
