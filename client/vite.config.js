import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // proxy to whichever port the backend is running on (override with env if needed)
      '/api': process.env.BACKEND_URL || 'http://localhost:3002'
    }
  }
})
