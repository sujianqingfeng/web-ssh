import { createBrowserRouter } from 'react-router-dom'
import Proxy from './pages/web-proxy.tsx'
import SSH from './pages/web-ssh.tsx'

export default createBrowserRouter([
  // {
  //   path: '/ssh',
  //   element: <SSH />
  // },
  {
    path: '/',
    element: <Proxy />
  }
])
