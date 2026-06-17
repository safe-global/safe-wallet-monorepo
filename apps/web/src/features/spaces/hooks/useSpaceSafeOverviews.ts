import { skipToken } from '@reduxjs/toolkit/query'
import { useMemo } from 'react'
import type { AllOwnedSafes } from '@safe-global/store/gateway/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { selectUndeployedSafes } from '@/store/slices'
import useWallet from '@/hooks/wallets/useWallet'
import type { SafeItem } from '@/hooks/safes'

type SpaceSafeRef = Pick<SafeItem, 'chainId' | 'address'>

/**
 * Derives per-Safe ownership for the connected wallet from the batched `getMultipleSafeOverviews`
 * data this surface already fetches, so ownership needs no separate per-owner request.
 *
 * The dashboard's cache entry is shared via the endpoint's `serializeQueryArgs` (same set of safes →
 * one entry). Ownership is derived client-side so the shared entry stays wallet-independent and a
 * wallet switch recomputes without a refetch.
 *
 * @param spaceSafeItems The space's safes to resolve ownership for (only chainId/address are read).
 * @returns `ownedByChain` — an `AllOwnedSafes` map (empty while loading or signed out → read-only) —
 *   and `isOwnershipResolved` for skeleton states.
 */
export const useSpaceSafeOverviews = (spaceSafeItems: SpaceSafeRef[]) => {
  const currency = useAppSelector(selectCurrency)
  const { address: wallet = '' } = useWallet() || {}
  const undeployedSafes = useAppSelector(selectUndeployedSafes)

  const { data: overviews } = useGetMultipleSafeOverviewsQuery(
    spaceSafeItems.length > 0 ? { safes: spaceSafeItems, currency } : skipToken,
  )

  const ownedByChain = useMemo<AllOwnedSafes>(() => {
    // While loading (or signed out) leave the map empty → every row read-only (fail-closed).
    if (!overviews || !wallet) return {}

    const map: AllOwnedSafes = {}
    const addOwned = (chainId: string, address: string) => {
      map[chainId] = map[chainId] ?? []
      map[chainId].push(address)
    }

    for (const overview of overviews) {
      if (overview.owners.some((owner) => sameAddress(owner.value, wallet))) {
        addOwned(overview.chainId, overview.address.value)
      }
    }

    // Counterfactual/undeployed safes have no overview; fall back to the local CF owner config,
    // exactly as the global `_buildSafeItem` does. Extra entries for safes outside the space are
    // harmless — the consumer only reads keys for space safes.
    for (const [chainId, safesOnChain] of Object.entries(undeployedSafes)) {
      for (const address of Object.keys(safesOnChain)) {
        const cfOwners = safesOnChain[address]?.props.safeAccountConfig.owners ?? []
        if (cfOwners.some((owner) => sameAddress(owner, wallet))) {
          addOwned(chainId, address)
        }
      }
    }

    return map
  }, [overviews, wallet, undeployedSafes])

  return { ownedByChain, isOwnershipResolved: overviews !== undefined }
}
