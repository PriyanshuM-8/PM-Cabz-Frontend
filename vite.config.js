import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const BACKEND = 'https://pm-cabz-backend.onrender.com'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/rides':    { target: BACKEND, changeOrigin: true, secure: false },
      '/maps':     { target: BACKEND, changeOrigin: true, secure: false },
      '/users':    { target: BACKEND, changeOrigin: true, secure: false },
      '/captains': { target: BACKEND, changeOrigin: true, secure: false },
      '/payment':  { target: BACKEND, changeOrigin: true, secure: false },
      '/admin':    { target: BACKEND, changeOrigin: true, secure: false },
    }
  }
})
