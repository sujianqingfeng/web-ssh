import { createBrowserRouter } from 'react-router-dom'
import RootLayout from './layouts/root.tsx'
import ErrorPage from './pages/error.tsx'
import Proxy from './pages/web-proxy.tsx'
import WebSSH from './pages/web-ssh/index.tsx'

export default createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <WebSSH />,
        errorElement: <ErrorPage />
      },
      {
        path: 'proxy',
        element: <Proxy />
      }
    ]
  }
])
