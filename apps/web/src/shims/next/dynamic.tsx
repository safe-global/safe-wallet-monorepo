/**
 * Shim for `next/dynamic` — wraps React.lazy() for code-splitting.
 *
 * Usage patterns supported:
 * - `dynamic(() => import('./Foo'))`                        — default export
 * - `dynamic(() => import('./Foo').then(m => ({default: m.Bar})))` — named export
 * - `dynamic(() => import('./Foo'), { ssr: false })`        — ssr option ignored in SPA
 */
import { lazy, type ComponentType } from 'react'

interface DynamicOptions {
  ssr?: boolean
  loading?: ComponentType
}

type Loader<P> = () => Promise<{ default: ComponentType<P> }>

function dynamic<P extends Record<string, unknown> = Record<string, unknown>>(
  loader: Loader<P>,
  _options?: DynamicOptions,
): ComponentType<P> {
  return lazy(loader)
}

export default dynamic
