import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ws': {
        target: 'http://localhost:3000',
        ws: false
      },
      '/proxy': {
        target: 'http://localhost:3000',
        ws: false
      }
    }
  }
})
