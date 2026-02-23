import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        exportType: 'named',
        ref: true,
        svgo: false,
        titleProp: true,
      },
      include: '**/*.svg',
    }),
  ],
  base: '/',
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react-dom') ||
              id.includes('@hello-pangea/dnd') ||
              id.includes('@mui') ||
              id.includes('react-router') ||
              id.includes('@remix-run/router')
            )
              return 'vendor'
            if (id.includes('ethers')) return 'ethers'
            if (id.includes('viem')) return 'viem'
            if (id.includes('axios')) return 'axios'
            if (id.includes('localforage')) return 'localforage'
          }
        },
      },
    },
  },
  server: {
    port: 4000,
    open: false,
  },
  preview: {
    port: 4000,
  },
})
