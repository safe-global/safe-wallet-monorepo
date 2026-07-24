import { useCallback } from 'react'
import ExternalStore from '@safe-global/utils/services/ExternalStore'
import { localItem } from '@/services/local-storage/local'
import type { PolicyType, Enforcement, TokenWithdrawPolicyData } from '@safe-global/store/gateway/policies/types'
import type { PolicyConfiguration } from './shared/guardTx'

/**
 * A policy change that was REQUESTED on-chain (`requestConfiguration`) and is
 * waiting out the SafePolicyGuard DELAY before it can be applied. Persisted
 * locally until the real CGW pending-policies endpoint lands — this is the
 * `savePolicyRequestApi` source of truth for the Pending section + Apply.
 */
export type PolicyRequest = {
  id: string
  chainId: string
  safeAddress: string
  type: PolicyType
  enforcement: Enforcement
  /** Human-readable policy info (currently the token-withdraw allowlist). */
  data: TokenWithdrawPolicyData
  /** The raw Configuration[] to replay in `applyConfiguration`. */
  configurations: PolicyConfiguration[]
  /** keccak256(abi.encode(configurations)) — matches the on-chain requested root. */
  configureRoot: string
  /** Unix seconds. readyAt = requestedAt + delaySec. */
  requestedAt: number
  readyAt: number
  delaySec: number
}

/** localStorage shape: keyed by `chainId:safeAddress` → the Safe's pending requests. */
type PolicyRequestStore = Record<string, PolicyRequest[]>

const store = localItem<PolicyRequestStore>('spacePolicyRequests')

// Single in-memory cache mirrored to localStorage, so imperative saves from a
// tx-flow success callback and the reactive hook stay in sync within the tab.
const { getStore, setStore, useStore } = new ExternalStore<PolicyRequestStore>(store.get() ?? {})

const safeKey = (chainId: string, safeAddress: string) => `${chainId}:${safeAddress.toLowerCase()}`

const write = (next: PolicyRequestStore) => {
  store.set(next)
  setStore(next)
}

/**
 * The imperative save API — callable outside React (e.g. from a tx-flow success
 * callback). De-dupes by `configureRoot` per Safe so re-requesting the same
 * change doesn't stack duplicate rows.
 */
export const savePolicyRequestApi = {
  save(request: PolicyRequest): void {
    const all = getStore() ?? {}
    const key = safeKey(request.chainId, request.safeAddress)
    const existing = all[key] ?? []
    const deduped = existing.filter((r) => r.configureRoot.toLowerCase() !== request.configureRoot.toLowerCase())
    write({ ...all, [key]: [request, ...deduped] })
  },

  get(chainId: string, safeAddress: string): PolicyRequest[] {
    return (getStore() ?? {})[safeKey(chainId, safeAddress)] ?? []
  },

  remove(chainId: string, safeAddress: string, id: string): void {
    const all = getStore() ?? {}
    const key = safeKey(chainId, safeAddress)
    const remaining = (all[key] ?? []).filter((r) => r.id !== id)
    if (remaining.length > 0) {
      write({ ...all, [key]: remaining })
    } else {
      const { [key]: _removed, ...rest } = all
      write(rest)
    }
  },
}

/**
 * Reactive view of a Safe's pending policy requests (re-renders on save/remove).
 * Provides `remove` bound to this Safe for the Apply flow.
 */
export const usePolicyRequests = (
  chainId: string,
  safeAddress: string,
): { requests: PolicyRequest[]; remove: (id: string) => void } => {
  const all = useStore()
  const requests = chainId && safeAddress ? (all?.[safeKey(chainId, safeAddress)] ?? []) : []

  const remove = useCallback(
    (id: string) => savePolicyRequestApi.remove(chainId, safeAddress, id),
    [chainId, safeAddress],
  )

  return { requests, remove }
}
