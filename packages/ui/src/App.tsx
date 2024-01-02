import { useEffect } from 'react'
import { socket } from './utils/socket'

function App() {
  useEffect(() => {
    const onDisconnect = () => {
      console.log('🚀 ~ file: App.tsx:11 ~ socket.on ~ connect: onDisconnect')
    }

    const onConnect = () => {
      console.log('🚀 ~ file: App.tsx:11 ~ socket.on ~ connect:')
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  return (
    <>
      <h1>Vite + React</h1>
    </>
  )
}

export default App
