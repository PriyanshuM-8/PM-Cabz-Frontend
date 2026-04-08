import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      '/rides': 'https://pm-cabz-backend.onrender.com',
      '/maps': 'https://pm-cabz-backend.onrender.com',
      '/users': 'https://pm-cabz-backend.onrender.com',
      '/captains': 'https://pm-cabz-backend.onrender.com',
      '/payment': 'https://pm-cabz-backend.onrender.com',
      '/admin': 'https://pm-cabz-backend.onrender.com',
    }
  }
})
