import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkHeadingId from 'remark-heading-id'
import remarkGfm from 'remark-gfm'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { swAssets } from './plugins/vite-plugin-sw-assets'
import { importMapIntegrity } from './plugins/vite-plugin-import-map-integrity'

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
export default defineConfig(({ mode }) => {
  // Vite normally exposes prefixed env vars on `import.meta.env`, but in
  // production builds it leaves unknown `import.meta.env.X` references as
  // runtime accesses against an object that doesn't exist — accessing
  // `.NEXT_PUBLIC_SAFE_VERSION` then throws. To make the prod build behave
  // like dev, gather every NEXT_PUBLIC_* / VITE_* value at build time and
  // inline them as a literal `process.env` object via `define`.
  const loadedEnv = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_', 'EXPO_PUBLIC_'])
  // `NODE_ENV` is typed as a narrow union, but the host shell can set it to
  // 'cypress' (see comment below). Read it as a plain string so that check holds.
  const hostNodeEnv = process.env.NODE_ENV as string
  const processEnv = {
    ...loadedEnv,
    // Build-time constants that override / supplement what loadEnv saw.
    NEXT_PUBLIC_COMMIT_HASH: commitHash,
    NEXT_PUBLIC_APP_VERSION: appVersion,
    NEXT_PUBLIC_APP_HOMEPAGE: pkg.homepage ?? '',
    // Honour an explicit cypress/test NODE_ENV from the host shell so the
    // existing `cross-env NODE_ENV=cypress cypress run` script can flip
    // `IS_TEST_E2E` in apps/web/src/config/constants.ts (and the require-login
    // gate it gates) without needing a separate NEXT_PUBLIC_IS_TEST_E2E flag.
    NODE_ENV:
      hostNodeEnv === 'cypress' || hostNodeEnv === 'test'
        ? hostNodeEnv
        : mode === 'production'
          ? 'production'
          : 'development',
  }

  return {
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
    // Eagerly pre-bundle the heavy MUI / web3 / Redux subgraph. By default Vite
    // discovers deps lazily on first import which produces hundreds of tiny
    // chunks served individually in dev. Forcing inclusion collapses each top
    // dep into a single optimized chunk.
    optimizeDeps: {
      include: [
        '@mui/material',
        '@mui/material/styles',
        '@mui/icons-material',
        '@mui/system',
        '@emotion/react',
        '@emotion/styled',
        '@emotion/cache',
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'react-dom/client',
        'react-redux',
        'react-helmet-async',
        '@reduxjs/toolkit',
        '@reduxjs/toolkit/query/react',
        '@tanstack/react-router',
        'lodash',
        'date-fns',
        'ethers',
        'classnames',
      ],
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
      // first such read throws synchronously and React never mounts. Inline an
      // object literal containing every prefixed env var + the build-time
      // constants — works in both dev and prod (unlike `import.meta.env`,
      // which is undefined at runtime in prod builds).
      'process.env': JSON.stringify(processEnv),
      // Some web3 deps reference `global` directly (not just `globalThis`).
      global: 'globalThis',
    },
    resolve: {
      alias: [
        // Next.js compatibility shims (decisions.md: cross-workspace next/* shimming)
        {
          find: 'next/dist/client/resolve-href',
          replacement: path.resolve(__dirname, 'src/compat/next-resolve-href.ts'),
        },
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
      // Tailwind v4 — required for `@apply`, `@reference`, and all utility
      // classes used both directly in JSX (`flex flex-wrap items-start ...`)
      // and inside CSS modules (`@apply absolute top-0 right-0`). Without
      // this, the entire shadcn/Tailwind layer is silently dropped and the
      // PageLayout positioning collapses.
      tailwindcss(),
      // MDX support for .md/.mdx imports (terms, cookie, privacy pages).
      // Mirrors the remark plugin list documented in
      // docs/migration/state/plan.md and matches what apps/web's next.config.mjs
      // uses through @mdx-js/loader. Must run BEFORE react() so React's
      // JSX transform sees the compiled MDX output.
      mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkHeadingId, remarkGfm],
      }),
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
        // Under Rolldown-powered Vite (v8) the plugin transpiles its SVG-as-JSX
        // output via Vite's `transformWithOxc`. Without an explicit `jsx`
        // option oxc parses but does not lower the JSX, so raw `<svg>` reaches
        // the bundler and every .svg import fails with a parse error. Force the
        // React 19 automatic runtime (same as @vitejs/plugin-react) so the JSX
        // is lowered to `react/jsx-runtime` calls.
        oxcOptions: {
          jsx: { runtime: 'automatic' },
        },
      }),
      // Scoped `require()` polyfill. One reused apps/web file uses sync
      // CommonJS require ('blo'). We can't use a global Vite
      // `define` for `require` because it would rewrite Vite's own client
      // code. Instead, prepend a module-local `const require = ...` only to
      // that exact file so the call site resolves at runtime through
      // `globalThis.__safeBrowserRequire` (installed by compat/require-shim.ts).
      {
        name: 'safe-scoped-require-shim',
        enforce: 'pre',
        transform(code, id) {
          if (id.includes('apps/web/src/components/common/SpaceSafeBar/AccountsModal/shared.tsx')) {
            return {
              code: `const require = globalThis.__safeBrowserRequire;\n${code}`,
              map: null,
            }
          }
          return null
        },
      },
      // The worker is bundled by Vite, so the `define` block above (process.env,
      // __APP_VERSION__) and the `@/` resolve aliases apply to it.
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src/service-worker',
        filename: 'sw.ts',
        registerType: 'prompt',
        // PwaReloadPrompt's useRegisterSW performs the single registration; no
        // competing auto-injected script.
        injectRegister: false,
        // Reuse the existing safe.webmanifest (linked via MetaTags); don't let
        // the plugin generate/inject its own manifest.
        manifest: false,
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
          // Exclude the stale publicDir service workers, the generated worker, and sourcemaps.
          globIgnores: ['firebase-messaging-sw.js', 'workbox-*.js', 'sw.js', '**/*.map'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html',
        },
      }),
      // Ordered after VitePWA so its cleanup runs once sw.js is generated.
      swAssets(path.resolve(__dirname, 'src/service-worker/offline.html')),
      importMapIntegrity(),
    ],
  }
})
