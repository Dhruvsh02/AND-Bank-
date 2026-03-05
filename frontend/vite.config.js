import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/auth':         { target: 'http://localhost:8001', changeOrigin: true },
      '/api/accounts':     { target: 'http://localhost:8002', changeOrigin: true },
      '/api/transactions': { target: 'http://localhost:8003', changeOrigin: true },
      '/api/loans':        { target: 'http://localhost:8004', changeOrigin: true },
      '/api/cards':        { target: 'http://localhost:8005', changeOrigin: true },
      '/api/notifications':{ target: 'http://localhost:8006', changeOrigin: true },
      '/api/admin':        { target: 'http://localhost:8007', changeOrigin: true },
      '/api/chat':         { target: 'http://localhost:8008', changeOrigin: true },
    }
  }
})