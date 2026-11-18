import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const PORT = 4001

export default defineConfig({
  resolve: {
    alias: {
      '@safe-global/theme': fileURLToPath(new URL('../../packages/theme/src', import.meta.url)),
    },
  },
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    outDir: 'build',
    sourcemap: true,
    // safe-apps-react-sdk is CommonJS, so it pulls in viem's whole CJS build (~710 kB)
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('viem') || id.includes('@noble') || id.includes('@adraffy')) return 'viem'
          if (id.includes('@mui') || id.includes('@emotion') || id.includes('@popperjs')) return 'mui'
          if (id.includes('react-dom') || id.includes('scheduler')) return 'react'
        },
      },
    },
  },
  server: {
    port: PORT,
    open: false,
    cors: true,
  },
  preview: {
    port: PORT,
    cors: true,
  },
})
