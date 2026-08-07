/**
 * Compatibility shim for `next/dynamic`.
 * Decision (plan.md / decisions.md): React.lazy + Suspense; `ssr: false` is
 * a no-op in this SPA target and is silently dropped.
 */
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'

export type DynamicOptions = {
  ssr?: boolean
  loading?: () => ReactNode | null
  suspense?: boolean
}

type Loader<P> = () => Promise<{ default: ComponentType<P> } | ComponentType<P>>

export default function dynamic<P extends object>(loader: Loader<P>, options: DynamicOptions = {}): ComponentType<P> {
  const Lazy = lazy(async () => {
    const mod = await loader()
    return 'default' in (mod as { default?: unknown })
      ? (mod as { default: ComponentType<P> })
      : { default: mod as ComponentType<P> }
  })

  const Fallback = options.loading ? <>{options.loading()}</> : null

  return function DynamicComponent(props: P) {
    return (
      <Suspense fallback={Fallback}>
        <Lazy {...props} />
      </Suspense>
    )
  }
}
