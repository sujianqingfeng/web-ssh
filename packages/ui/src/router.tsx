import { createBrowserRouter } from 'react-router-dom'
import ErrorPage from './pages/error.tsx'
import Proxy from './pages/web-proxy.tsx'
import SSH from './pages/web-ssh.tsx'

export default createBrowserRouter([
  {
    path: '/',
    element: <SSH />,
    errorElement: <ErrorPage />
  },
  {
    path: '/proxy',
    element: <Proxy />
  }
])
