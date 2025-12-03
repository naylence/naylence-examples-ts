import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }]
        ]
      }
    })
  ],
  resolve: {
    alias: {
      // Ensure we use the runtime from this package's node_modules, not nested ones
      '@naylence/runtime': resolve(__dirname, 'node_modules/@naylence/runtime'),
      '@naylence/core': resolve(__dirname, 'node_modules/@naylence/core'),
      '@naylence/factory': resolve(__dirname, 'node_modules/@naylence/factory'),
      '@naylence/agent-sdk': resolve(__dirname, 'node_modules/@naylence/agent-sdk'),
    }
  },
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
