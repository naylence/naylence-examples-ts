import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@opentelemetry/api']
  },
  build: {
    rollupOptions: {
      external: ['@opentelemetry/api']
    }
  },
  server: {
    port: 3000
  },
})
