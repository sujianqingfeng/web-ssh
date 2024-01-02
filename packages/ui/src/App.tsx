import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { socket } from './utils/socket'
import 'xterm/css/xterm.css'

function App() {
  const xtermRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const term = new Terminal()
    term.open(xtermRef.current!)

    const onDisconnect = () => {
      console.log('🚀 ~ file: App.tsx:11 ~ socket.on ~ connect: onDisconnect')
    }

    const onConnect = () => {
      socket.emit('ssh-connection')
    }

    const onSSHConnection = () => {}

    const onData = (data: Uint8Array) => {
      const text = new TextDecoder().decode(data)
      term.write(text)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('ssh-connection', onSSHConnection)
    socket.on('data', onData)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  return (
    <>
      <h1 className="text-[30px] font-bold">Web SSH</h1>
      <div ref={xtermRef}></div>
    </>
  )
}

export default App
