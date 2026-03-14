import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
// @ts-expect-error -- no type declarations
import remarkHeadingId from 'remark-heading-id'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, type PluginOption } from 'vite'
import svgr from 'vite-plugin-svgr'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pkg = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf-8'))

let commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH
if (!commitHash) {
  try {
    commitHash = execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    commitHash = ''
  }
}

let appVersion = pkg.version
if (process.env.VISUAL_REGRESSION_BUILD === 'true') {
  commitHash = 'vistest'
  appVersion = 'istest'
}

// Shim base path for all Next.js compatibility shims
const shimsDir = path.resolve(__dirname, 'src/shims/next')

// Collect all NEXT_PUBLIC_* env vars so `process.env.NEXT_PUBLIC_*` works in source code.
// Vite's envPrefix exposes them as import.meta.env, but existing code uses process.env.
const processEnvDefines: Record<string, string> = {}
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith('NEXT_PUBLIC_') && value !== undefined) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value)
  }
}
// Override computed values (commit hash, version from package.json)
processEnvDefines['process.env.NEXT_PUBLIC_COMMIT_HASH'] = JSON.stringify(commitHash)
processEnvDefines['process.env.NEXT_PUBLIC_APP_VERSION'] = JSON.stringify(appVersion)
processEnvDefines['process.env.NEXT_PUBLIC_APP_HOMEPAGE'] = JSON.stringify(pkg.homepage)

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
    }),
    svgr({
      svgrOptions: {
        titleProp: true,
        svgo: false,
      },
    }),
    {
      enforce: 'pre',
      ...(await import('@mdx-js/rollup')).default({
        remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'metadata' }], remarkHeadingId, remarkGfm],
      }),
    } as PluginOption,
    tailwindcss(),
    ...(process.env.ANALYZE === 'true'
      ? [
          visualizer({
            open: true,
            filename: 'bundle-stats.html',
          }) as PluginOption,
        ]
      : []),
  ],

  resolve: {
    alias: {
      '@/': path.resolve(__dirname, 'src') + '/',
      // Bare `src/` imports used in a few files (e.g., CookieAndTermBanner)
      'src/': path.resolve(__dirname, 'src') + '/',

      // Monorepo packages
      '@safe-global/utils/': path.resolve(__dirname, '../../packages/utils/src') + '/',
      '@safe-global/store/': path.resolve(__dirname, '../../packages/store/src') + '/',

      // Next.js shims — order matters: more specific paths first
      'next/dist/client/resolve-href': path.resolve(shimsDir, 'resolve-href.ts'),
      'next/dist/client/link': path.resolve(shimsDir, 'link.tsx'),
      'next/compat/router': path.resolve(shimsDir, 'compat-router.ts'),
      'next/router': path.resolve(shimsDir, 'router.ts'),
      'next/navigation': path.resolve(shimsDir, 'navigation.ts'),
      'next/link': path.resolve(shimsDir, 'link.tsx'),
      'next/head': path.resolve(shimsDir, 'head.tsx'),
      'next/dynamic': path.resolve(shimsDir, 'dynamic.tsx'),
      'next/image': path.resolve(shimsDir, 'image.tsx'),
      'next/script': path.resolve(shimsDir, 'script.tsx'),
      'next/app': path.resolve(shimsDir, 'app.ts'),
      'next/document': path.resolve(shimsDir, 'document.tsx'),
      '@next/third-parties/google': path.resolve(shimsDir, 'third-parties-google.tsx'),
      next: path.resolve(shimsDir, 'types.ts'),

      // Deduplicate bn.js
      'bn.js': path.resolve(__dirname, '../../node_modules/bn.js/lib/bn.js'),

      // MUI barrel re-export optimization
      '@mui/material$': path.resolve(__dirname, 'src/components/common/Mui'),
    },
  },

  envPrefix: ['NEXT_PUBLIC_', 'VITE_'],

  define: {
    ...processEnvDefines,
    'process.env.VISUAL_REGRESSION_BUILD': JSON.stringify(process.env.VISUAL_REGRESSION_BUILD || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },

  build: {
    outDir: 'out',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@safe-global/protocol-kit') || id.includes('ethers')) {
            return 'protocol-kit-ethers'
          }
        },
      },
    },
  },

  server: {
    fs: {
      strict: false,
    },
  },
})
