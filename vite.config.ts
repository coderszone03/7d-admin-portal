import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND_ORIGIN = 'https://7ddesign-backend.maverickz.online'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/admin': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
        secure: true,
      },
      '/api': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
        secure: true,
      },
      '/storage': {
        target: BACKEND_ORIGIN,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
