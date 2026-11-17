import { memo, useLayoutEffect, useSyncExternalStore, type ReactElement, type ReactNode } from 'react'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { SafeScopeContext, useSafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import type { SafeScopeContextValue } from '@safe-global/views/components/tx-flow/safe-scope/types'
import { buildSafeScopeKey } from '@safe-global/views/components/tx-flow/safe-scope/utils'

export type ScopeTarget = { scopeKey: string; chainId: string; safeAddress: string }

const noop = () => {}

// What a provider shows before its first render: the Safe, still loading
const loadingScope = ({ chainId, safeAddress }: ScopeTarget): SafeScopeContextValue => ({
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
  const loading = new Map<string, SafeScopeContextValue>()
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())

  return {
    read: (target: ScopeTarget): SafeScopeContextValue => {
      const value = published.get(target.scopeKey)
      if (value) return value
      const placeholder = loading.get(target.scopeKey) ?? loadingScope(target)
      loading.set(target.scopeKey, placeholder)
      return placeholder
    },
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
          <SafeScopeProvider key={scopeKey} initial={{ chainId, safeAddress }} pollSafeInfo={false}>
            <PublishScope scopeKey={scopeKey} store={store} />
          </SafeScopeProvider>
        ))}
      </>
    )
  },
  (prev, next) => prev.store === next.store && sameTargets(prev.targets, next.targets),
)

export const PooledScope = ({
  target,
  store,
  children,
}: {
  target: ScopeTarget
  store: ScopeStore
  children: ReactNode
}): ReactElement => {
  const read = () => store.read(target)
  const value = useSyncExternalStore(store.subscribe, read, read)
  return <SafeScopeContext.Provider value={value}>{children}</SafeScopeContext.Provider>
}
