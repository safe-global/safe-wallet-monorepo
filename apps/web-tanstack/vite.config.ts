import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const webRoot = path.resolve(__dirname, '../web')
const pkg = JSON.parse(readFileSync(path.resolve(webRoot, 'package.json'), 'utf-8'))

let commitHash = process.env.VITE_COMMIT_HASH || process.env.NEXT_PUBLIC_COMMIT_HASH || ''
if (!commitHash) {
  try {
    commitHash = execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    commitHash = ''
  }
}

const appVersion = process.env.VISUAL_REGRESSION_BUILD === 'true' ? 'vistest' : pkg.version
if (process.env.VISUAL_REGRESSION_BUILD === 'true') commitHash = 'vistest'

// See decisions.md: env vars are renamed to VITE_* but a transitional shim
// re-exports them under their original NEXT_PUBLIC_* names so 99 existing
// call-sites can migrate incrementally. Build-time constants are injected here.
export default defineConfig({
  publicDir: path.resolve(webRoot, 'public'),
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    port: 3001,
    strictPort: true,
  },
  preview: {
    port: 3001,
    strictPort: true,
  },
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_HOMEPAGE__: JSON.stringify(pkg.homepage ?? ''),
    // Build-time NEXT_PUBLIC_* vars that apps/web's next.config.mjs injects.
    // Mirror the same set so reused source modules (e.g. config/version.ts)
    // see real values at module-eval time.
    'import.meta.env.NEXT_PUBLIC_COMMIT_HASH': JSON.stringify(commitHash),
    'import.meta.env.NEXT_PUBLIC_APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.NEXT_PUBLIC_APP_HOMEPAGE': JSON.stringify(pkg.homepage ?? ''),
    // Reused code in apps/web/src and packages/* reads `process.env.NEXT_PUBLIC_*`
    // at module top level. Vite has no `process` global in the browser, so the
    // first such read throws synchronously and React never mounts. Re-route
    // every `process.env.X` to `import.meta.env.X`, which `envPrefix` already
    // populates from NEXT_PUBLIC_* and VITE_* vars.
    'process.env': 'import.meta.env',
    // Some web3 deps reference `global` directly (not just `globalThis`).
    global: 'globalThis',
  },
  resolve: {
    alias: [
      // Next.js compatibility shims (decisions.md: cross-workspace next/* shimming)
      { find: 'next/router', replacement: path.resolve(__dirname, 'src/compat/next-router.tsx') },
      { find: 'next/link', replacement: path.resolve(__dirname, 'src/compat/next-link.tsx') },
      { find: 'next/head', replacement: path.resolve(__dirname, 'src/compat/next-head.tsx') },
      { find: 'next/dynamic', replacement: path.resolve(__dirname, 'src/compat/next-dynamic.tsx') },
      { find: 'next/image', replacement: path.resolve(__dirname, 'src/compat/next-image.tsx') },
      { find: 'next/app', replacement: path.resolve(__dirname, 'src/compat/next-app.ts') },
      { find: 'next/navigation', replacement: path.resolve(__dirname, 'src/compat/next-navigation.tsx') },

      // Node builtins referenced by reused source. `querystring-es3` is the
      // standard browser polyfill webpack/Next uses internally, already in the lockfile.
      { find: /^querystring$/, replacement: 'querystring-es3' },

      // Vite-native fork of the features/__core__ barrel. The original
      // uses template-literal dynamic imports that Vite cannot analyze;
      // this fork swaps in a Vite-native createFeatureHandle backed by
      // import.meta.glob. Must appear BEFORE the broader `@/...` alias
      // below so it takes precedence. Match the barrel exactly (no
      // trailing segment) and also the direct module path for callers
      // that bypass the barrel.
      {
        find: /^@\/features\/__core__$/,
        replacement: path.resolve(__dirname, 'src/compat/features-core.ts'),
      },
      {
        find: /^@\/features\/__core__\/createFeatureHandle$/,
        replacement: path.resolve(__dirname, 'src/compat/createFeatureHandle.ts'),
      },

      // Cross-workspace source aliases — reuse apps/web/src verbatim during cutover.
      { find: /^@\/public\/(.*)$/, replacement: path.resolve(webRoot, 'public/$1') },
      { find: /^@\/(.*)$/, replacement: path.resolve(webRoot, 'src/$1') },

      // Mirror apps/web/tsconfig.json `paths` so reused source resolves shared
      // packages by subpath (e.g. `@safe-global/utils/utils/chains`).
      { find: /^@safe-global\/theme\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/theme/src/$1') },
      { find: /^@safe-global\/store\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/store/src/$1') },
      { find: /^@safe-global\/utils\/(.*)$/, replacement: path.resolve(__dirname, '../../packages/utils/src/$1') },
      { find: /^@safe-global\/test\/(.*)$/, replacement: path.resolve(__dirname, '../../config/test/$1') },

      // apps/web/src/pages/_app.tsx uses bare `src/...` imports (Next.js baseUrl convention).
      { find: /^src\/(.*)$/, replacement: path.resolve(webRoot, 'src/$1') },

      // Webpack aliases ported verbatim from apps/web/next.config.mjs.
      { find: /^@mui\/material$/, replacement: path.resolve(webRoot, 'src/components/common/Mui') },
      { find: 'bn.js', replacement: path.resolve(__dirname, '../../node_modules/bn.js/lib/bn.js') },
    ],
  },
  plugins: [
    react(),
    svgr({
      // Reused apps/web code does `import Icon from './x.svg'` and renders
      // <Icon />. Webpack's @svgr/webpack returns a React component by
      // default; vite-plugin-svgr returns the URL unless we opt in. Include
      // every .svg and emit the component as the default export so the
      // existing import sites work unchanged.
      include: '**/*.svg',
      svgrOptions: {
        prettier: false,
        svgo: false,
        titleProp: true,
      },
    }),
    // Scoped `require()` polyfill. Two reused apps/web files use sync
    // CommonJS require (chains.json, 'blo'). We can't use a global Vite
    // `define` for `require` because it would rewrite Vite's own client
    // code. Instead, prepend a module-local `const require = ...` only to
    // those exact files so the call site resolves at runtime through
    // `globalThis.__safeBrowserRequire` (installed by compat/require-shim.ts).
    {
      name: 'safe-scoped-require-shim',
      enforce: 'pre',
      transform(code, id) {
        if (
          id.includes('apps/web/src/store/index.ts') ||
          id.includes('apps/web/src/components/common/SpaceSafeBar/AccountsModal/shared.tsx')
        ) {
          return {
            code: `const require = globalThis.__safeBrowserRequire;\n${code}`,
            map: null,
          }
        }
        return null
      },
    },
  ],
})
