import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isDocker = process.env.IS_DOCKER === 'true' || process.cwd() === '/app';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: isDocker ? '.' : '../',
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/receipts': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    },
    watch: {
      usePolling: true
    }
  }
})

