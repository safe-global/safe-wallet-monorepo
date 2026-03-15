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
import vitePrerender from 'vite-plugin-prerender'
import svgr from 'vite-plugin-svgr'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pkg = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf-8'))

// Extract all route strings from AppRoutes for pre-rendering
function collectRoutes(obj: Record<string, unknown>): string[] {
  const routes: string[] = []
  for (const value of Object.values(obj)) {
    if (typeof value === 'string') {
      routes.push(value)
    } else if (typeof value === 'object' && value !== null) {
      routes.push(...collectRoutes(value as Record<string, unknown>))
    }
  }
  return routes
}

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
    ...(process.env.SKIP_PRERENDER !== '1'
      ? [
          vitePrerender({
            staticDir: path.join(__dirname, 'out'),
            routes: collectRoutes(
              // Inline the route map — kept in sync with src/config/routes.ts
              // Using inline avoids importing TS source from vite.config
              {
                '403': '/403',
                '404': '/404',
                wc: '/wc',
                userSettings: '/user-settings',
                terms: '/terms',
                safeLabsTerms: '/safe-labs-terms',
                swap: '/swap',
                stake: '/stake',
                privacy: '/privacy',
                licenses: '/licenses',
                index: '/',
                imprint: '/imprint',
                home: '/home',
                earn: '/earn',
                cookie: '/cookie',
                bridge: '/bridge',
                addressBook: '/address-book',
                hypernative: { oauthCallback: '/hypernative/oauth-callback' },
                addOwner: '/addOwner',
                _offline: '/_offline',
                apps: {
                  open: '/apps/open',
                  index: '/apps',
                  custom: '/apps/custom',
                  bookmarked: '/apps/bookmarked',
                },
                balances: {
                  positions: '/balances/positions',
                  nfts: '/balances/nfts',
                  index: '/balances',
                },
                newSafe: {
                  load: '/new-safe/load',
                  create: '/new-safe/create',
                  advancedCreate: '/new-safe/advanced-create',
                },
                settings: {
                  setup: '/settings/setup',
                  security: '/settings/security',
                  notifications: '/settings/notifications',
                  modules: '/settings/modules',
                  index: '/settings',
                  environmentVariables: '/settings/environment-variables',
                  data: '/settings/data',
                  cookies: '/settings/cookies',
                  appearance: '/settings/appearance',
                  safeApps: { index: '/settings/safe-apps' },
                },
                share: { safeApp: '/share/safe-app' },
                spaces: {
                  settings: '/spaces/settings',
                  safeAccounts: '/spaces/safe-accounts',
                  members: '/spaces/members',
                  index: '/spaces',
                  addressBook: '/spaces/address-book',
                },
                transactions: {
                  tx: '/transactions/tx',
                  queue: '/transactions/queue',
                  msg: '/transactions/msg',
                  messages: '/transactions/messages',
                  index: '/transactions',
                  history: '/transactions/history',
                },
                welcome: {
                  spaces: '/welcome/spaces',
                  index: '/welcome',
                  accounts: '/welcome/accounts',
                },
              },
            ),
            // @ts-expect-error -- no type declarations for renderer-puppeteer
            renderer: new (await import('@prerenderer/renderer-puppeteer')).default({
              maxConcurrentRoutes: 4,
              renderAfterElementExists: '#root > *',
              skipThirdPartyRequests: true,
            }),
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
