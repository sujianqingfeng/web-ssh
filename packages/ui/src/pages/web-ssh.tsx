import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { socket } from '../utils/socket'
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

    const onSSHConnection = () => {
      console.log('🚀 ~ file: App.tsx:22 ~ onSSHConnection ~ onSSHConnection:')
      let tempChar = ''
      term.attachCustomKeyEventHandler((event) => {
        console.log(
          '🚀 ~ file: App.tsx:24 ~ term.attachCustomKeyEventHandler ~ event:',
          event
        )

        if (event.type === 'keypress' && event.key !== 'Enter') {
          const char = event.key || String.fromCharCode(event.keyCode)
          console.log(
            '🚀 ~ file: App.tsx:25 ~ term.attachCustomKeyEventHandler ~ char:',
            char
          )
          term.write(char)
          tempChar += char
        }

        if (event.type === 'keydown') {
          if (event.key === 'Backspace') {
            if (tempChar.length > 0) {
              term.write('\b \b')
              tempChar = tempChar.slice(0, -1)
            }
          }
          if (event.key === 'Enter') {
            term.write('\r\n')
            socket.emit('command', tempChar)
            tempChar = ''
          }
        }
        return false
      })
    }

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
