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
  base: '/tx-builder/',
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  server: {
    port: 4000,
    open: false,
  },
  preview: {
    port: 4000,
  },
})
