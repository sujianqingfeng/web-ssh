import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { socket } from '../utils/socket'
import 'xterm/css/xterm.css'
import { Input } from '@/components/ui/input'

function removeChars(term: Terminal, len: number) {
  for (let i = 0; i < len; i++) {
    term.write('\b \b')
  }
}

export default function SSH() {
  const xtermRef = useRef<HTMLDivElement>(null)
  const term = new Terminal()

  console.log('useEffect is running')

  useEffect(() => {
    xtermRef.current!.innerHTML = ''
    term.open(xtermRef.current!)

    const onDisconnect = () => {
      console.log('🚀 ~ file: App.tsx:11 ~ socket.on ~ connect: onDisconnect')
    }

    const onConnect = () => {
      socket.emit('ssh-connection', onSSHConnection)
    }

    const onSSHConnection = () => {
      // term.attachCustomKeyEventHandler((event) => {
      //   return false
      // })

      term.onKey((event) => {
        console.log('🚀 ~ file: web-ssh.tsx:53 ~ term.onKey ~ event:', event)
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

      term.focus()
    }

    const onData = (data: Uint8Array) => {
      const text = new TextDecoder().decode(data)
      term.write(text)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('data', onData)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('data', onData)
      socket.off('ssh-connection', onSSHConnection)
    }
  }, [])

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    console.log('🚀 ~ file: web-ssh.tsx:67 ~ onFileChange ~ file:', file)
    socket.emit('upload', file, file.name)
  }

  return (
    <>
      <header className="p-2 flex justify-between items-center ">
        <div className="text-[30px] font-bold">Web SSH</div>
        <div className="flex justify-center items-center">
          <label className="inline-flex cursor-pointer font-medium bg-primary text-sm rounded-md text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            Upload
            <Input
              className="hidden"
              id="picture"
              type="file"
              onChange={onFileChange}
            />
          </label>
        </div>
      </header>
      <div id="terminal" ref={xtermRef}></div>
    </>
  )
}
