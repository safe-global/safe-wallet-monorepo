// Webpack/Next polyfills synchronous `require()` for browser code; Vite does
// not. One reused file in apps/web/src uses `require()`:
//   - apps/web/src/components/common/SpaceSafeBar/AccountsModal/shared.tsx:26
//     — `require('blo')` for blockie avatars
//
// Polyfill a global `require` that resolves exactly that path. Any other
// path throws so we notice it during migration instead of silently degrading.
//
// Imported first thing in main.tsx, before any reused code runs.

import * as bloModule from 'blo'

const RESOLVERS: Record<string, unknown> = {
  blo: bloModule,
}

const browserRequire = (path: string): any => {
  if (path in RESOLVERS) return RESOLVERS[path]
  throw new Error(
    `require('${path}') is not supported in the Vite browser bundle. ` +
      `Add an entry to apps/web-tanstack/src/compat/require-shim.ts or convert the call site to an ES import.`,
  )
}

// Vite's `define: { require: '__safeBrowserRequire' }` rewrites every
// `require(x)` in transformed source to `__safeBrowserRequire(x)`. Expose
// the function under that exact name on globalThis so the rewritten calls
// resolve at runtime.

;(globalThis as any).__safeBrowserRequire = browserRequire
