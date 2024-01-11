import path from 'path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

const resolve = (...dirs: string[]) => path.join(__dirname, ...dirs)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ws': {
        target: 'http://localhost:4000',
        ws: false
      },
      '/proxy': {
        target: 'http://localhost:4000',
        ws: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },

  build: {
    outDir: resolve('../server/public')
  }
})
