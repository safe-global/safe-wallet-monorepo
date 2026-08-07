/**
 * Compatibility shim for `next/app` — type-only surface.
 * The Vite SPA has no _app concept; this only exists so reused apps/web
 * files that `import type { AppProps } from 'next/app'` continue to compile
 * during cutover.
 */
import type { ComponentType } from 'react'
import type { NextRouter } from './next-router'

export interface AppProps<P = Record<string, unknown>> {
  Component: ComponentType<P>
  pageProps: P
  router: NextRouter
}

export type AppType<P = Record<string, unknown>> = ComponentType<AppProps<P>>

const App = {} as const
export default App
