import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import type { UndeployedSafesState } from '@safe-global/utils/features/counterfactual/store/types'
import type { SpaceSafeEntry, SelectedSafe } from './types'

/** Build SpaceSafeEntry[] from the raw space items, applying the client's local undeployed flags. */
export const flattenSafes = (
  allSafes: Array<SafeItem | MultiChainSafeItem>,
  undeployedSafes: UndeployedSafesState,
): SpaceSafeEntry[] =>
  allSafes.flatMap<SpaceSafeEntry>((item) => {
    if (isMultiChainSafeItem(item)) {
      // A multichain group with no chains is malformed (the grouping logic upstream
      // never produces one in practice). Skip rather than synthesising a mainnet
      // entry — a bogus chainId would queue scans for a Safe that doesn't exist there.
      const firstChainId = item.safes[0]?.chainId
      if (!firstChainId) return []
      return [
        {
          address: item.address,
          chainId: firstChainId,
          name: item.name,
          isMultichain: true,
          chainEntries: item.safes.map((s) => ({
            chainId: s.chainId,
            isDeployed: !undeployedSafes[s.chainId]?.[s.address],
          })),
        },
      ]
    }
    const isDeployed = !undeployedSafes[item.chainId]?.[item.address]
    return [
      {
        address: item.address,
        chainId: item.chainId,
        name: item.name,
        isMultichain: false,
        chainEntries: [{ chainId: item.chainId, isDeployed }],
      },
    ]
  })

/** Collect all deployed chain entries across all safes. */
export const getDeployedEntries = (safes: SpaceSafeEntry[]): SelectedSafe[] =>
  safes.flatMap((safe) =>
    safe.chainEntries.filter((c) => c.isDeployed).map((c) => ({ address: safe.address, chainId: c.chainId })),
  )

/**
 * Project the deployed chain entries into the `SafeItem` shape required by
 * `useGetMultipleSafeOverviewsQuery`. The per-Safe metadata fields are unused by
 * the overview endpoint — we only need `(chainId, address)`.
 */
export const toSafeItems = (safes: SpaceSafeEntry[]): SafeItem[] =>
  safes.flatMap((safe) =>
    safe.chainEntries
      .filter((c) => c.isDeployed)
      .map((c) => ({
        chainId: c.chainId,
        address: safe.address,
        isReadOnly: false,
        isPinned: false,
        lastVisited: 0,
        name: undefined,
      })),
  )

/**
 * Reconcile local `isDeployed` flags against CGW's confirmed deployments.
 *
 * The local `undeployedSafes` slice only tracks counterfactual Safes this browser created.
 * Multichain Safes coming from the space API can include chains that are counterfactual for
 * another space member — `isDeployed` resolves to `true` locally, but CGW has no on-chain
 * Safe to return. Without this reconciliation the table shows a chevron (scannable) for the
 * ghost chain, the scan queue enqueues it, and its queries 404 — hanging the sequential queue.
 *
 * `confirmedDeployedKeys` is the set of `scanKey(address, chainId)` strings present in the
 * batch overview response. Pass `null` while the query is still loading or returned nothing
 * (treat as inconclusive) — the function then leaves flags untouched.
 */
export const reconcileDeployedSafes = (
  safes: SpaceSafeEntry[],
  confirmedDeployedKeys: Set<string> | null,
  scanKey: (address: string, chainId: string) => string,
): SpaceSafeEntry[] => {
  if (!confirmedDeployedKeys) return safes
  return safes.map((safe) => {
    const reconciled = safe.chainEntries.map((c) =>
      c.isDeployed && !confirmedDeployedKeys.has(scanKey(safe.address, c.chainId)) ? { ...c, isDeployed: false } : c,
    )
    const changed = reconciled.some((c, i) => c !== safe.chainEntries[i])
    return changed ? { ...safe, chainEntries: reconciled } : safe
  })
}
