import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const BACKEND = process.env.VITE_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/rides':    { target: 'http://localhost:3000', changeOrigin: true },
      '/maps':     { target: 'http://localhost:3000', changeOrigin: true },
      '/users':    { target: 'http://localhost:3000', changeOrigin: true },
      '/captains': { target: 'http://localhost:3000', changeOrigin: true },
      '/payment':  { target: 'http://localhost:3000', changeOrigin: true },
      '/admin':    { target: 'http://localhost:3000', changeOrigin: true },
    }
  }
})
