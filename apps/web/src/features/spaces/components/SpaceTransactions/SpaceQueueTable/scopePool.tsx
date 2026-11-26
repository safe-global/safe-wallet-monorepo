import { memo, useLayoutEffect, useMemo, useSyncExternalStore, type ReactElement, type ReactNode } from 'react'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { SafeScopeContext, useSafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import type { SafeScopeContextValue } from '@safe-global/views/components/tx-flow/safe-scope/types'
import { buildSafeScopeKey } from '@safe-global/views/components/tx-flow/safe-scope/utils'

export type ScopeTarget = { scopeKey: string; chainId: string; safeAddress: string }

const noop = () => {}

// What a row shows before its provider publishes: the Safe, still loading
const loadingScope = (chainId: string, safeAddress: string): SafeScopeContextValue => ({
  scope: {
    chainId,
    safeAddress,
    scopeKey: buildSafeScopeKey(chainId, safeAddress),
    safeLoaded: false,
    safeLoading: true,
  },
  setScope: noop,
  clearScope: noop,
})

/** The scope of each Safe and chain the table shows, published by its provider and read by its rows. */
export const createScopeStore = () => {
  const published = new Map<string, SafeScopeContextValue>()
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())

  return {
    get: (scopeKey: string): SafeScopeContextValue | undefined => published.get(scopeKey),
    publish: (scopeKey: string, value: SafeScopeContextValue) => {
      published.set(scopeKey, value)
      notify()
    },
    remove: (scopeKey: string) => {
      if (published.delete(scopeKey)) notify()
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export type ScopeStore = ReturnType<typeof createScopeStore>

const PublishScope = ({ scopeKey, store }: { scopeKey: string; store: ScopeStore }): null => {
  const value = useSafeScopeContext()
  useLayoutEffect(() => {
    if (value) store.publish(scopeKey, value)
  }, [store, scopeKey, value])
  useLayoutEffect(() => () => store.remove(scopeKey), [store, scopeKey])
  return null
}

const sameTargets = (a: ScopeTarget[], b: ScopeTarget[]): boolean =>
  a.length === b.length && a.every((target, index) => target.scopeKey === b[index].scopeKey)

/** One provider, so one SDK, per Safe and chain however its rows interleave; they render no markup. */
export const ScopePool = memo(
  function ScopePool({ targets, store }: { targets: ScopeTarget[]; store: ScopeStore }): ReactElement {
    return (
      <>
        {targets.map(({ scopeKey, chainId, safeAddress }) => (
          <SafeScopeProvider
            key={scopeKey}
            initial={{ chainId, safeAddress }}
            pollSafeInfo={false}
            armsSdkGuard={false}
          >
            <PublishScope scopeKey={scopeKey} store={store} />
          </SafeScopeProvider>
        ))}
      </>
    )
  },
  (prev, next) => prev.store === next.store && sameTargets(prev.targets, next.targets),
)

export const PooledScope = ({
  target: { scopeKey, chainId, safeAddress },
  store,
  children,
}: {
  target: ScopeTarget
  store: ScopeStore
  children: ReactNode
}): ReactElement => {
  const placeholder = useMemo(() => loadingScope(chainId, safeAddress), [chainId, safeAddress])
  const read = () => store.get(scopeKey) ?? placeholder
  const value = useSyncExternalStore(store.subscribe, read, read)
  return <SafeScopeContext.Provider value={value}>{children}</SafeScopeContext.Provider>
}
