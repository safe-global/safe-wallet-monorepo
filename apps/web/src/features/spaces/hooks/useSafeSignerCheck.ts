import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import type { SafeItem } from '@safe-global/views/hooks/safes/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useAllOwnedSafes from '@/hooks/safes/useAllOwnedSafes'
import useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { useGetMultipleSafeOverviewsQuery, useGetProposerSafesQuery } from '@/store/api/gateway'
import { selectCurrency } from '@/store/settingsSlice'

export type SafeSignerStatus = 'signer' | 'pending' | 'not-signer'

const safeKey = (chainId: string, address: string) => `${chainId}:${address.toLowerCase()}`

/**
 * CheckWallet's role check (owner, proposer, nested-Safe owner) for a list of Space Safes. Fail-closed:
 * a Safe the wallet doesn't own directly is `pending` until the checks resolve; a failed check counts as no role.
 * Spending-limit-only beneficiaries are not signers: the scoped transfer flow can't use the allowance
 * (`isOnlySpendingLimitBeneficiary && !isScoped` in tx-flow/flows/TokenTransfer/utils.ts).
 */
export const useSafeSignerCheck = (safes: SafeItem[], enabled: boolean) => {
  const { address: wallet = '' } = useWallet() || {}
  const currency = useAppSelector(selectCurrency)
  const { configs: chains, loading: isChainsLoading } = useChains()
  const shouldCheck = enabled && !!wallet

  // Same args as `useSpaceSafeOverviews`, so this reads its cache entry instead of costing a request.
  const overviewSafes = useMemo(() => safes.map(({ chainId, address }) => ({ chainId, address })), [safes])
  const overviewsQuery = useGetMultipleSafeOverviewsQuery(
    shouldCheck && overviewSafes.length > 0 ? { safes: overviewSafes, currency } : skipToken,
  )

  // One delegates request per distinct chain the Safes are on, not one per Safe.
  const proposerChains = useMemo(() => {
    const chainIds = new Set(safes.map((safe) => safe.chainId))
    return chains.filter((chain) => chainIds.has(chain.chainId))
  }, [chains, safes])
  const proposerSafesQuery = useGetProposerSafesQuery(
    shouldCheck && proposerChains.length > 0 ? { chains: proposerChains, delegate: wallet } : skipToken,
  )

  const [ownedSafes, ownedSafesError] = useAllOwnedSafes(shouldCheck ? wallet : '')

  const overviews = overviewsQuery.currentData
  const proposerSafes = proposerSafesQuery.currentData

  const isOverviewsResolved = overviews !== undefined || overviewsQuery.isError
  const isProposerResolved =
    proposerSafes !== undefined ||
    proposerSafesQuery.isError ||
    (proposerSafesQuery.isUninitialized && !isChainsLoading)
  const isOwnedResolved = ownedSafes !== undefined || ownedSafesError !== undefined
  const isResolved = isOverviewsResolved && isProposerResolved && isOwnedResolved

  const nestedOwnerSafes = useMemo(() => {
    const keys = new Set<string>()
    if (!overviews || !ownedSafes) return keys
    for (const overview of overviews) {
      const ownedOnChain = ownedSafes[overview.chainId] ?? []
      if (overview.owners.some((owner) => ownedOnChain.some((owned) => sameAddress(owned, owner.value)))) {
        keys.add(safeKey(overview.chainId, overview.address.value))
      }
    }
    return keys
  }, [overviews, ownedSafes])

  return useCallback(
    (safe: SafeItem): SafeSignerStatus => {
      if (!safe.isReadOnly) return 'signer'
      if (!isResolved) return 'pending'

      const isProposer = (proposerSafes?.[safe.chainId] ?? []).some((address) => sameAddress(address, safe.address))
      if (isProposer || nestedOwnerSafes.has(safeKey(safe.chainId, safe.address))) return 'signer'

      return 'not-signer'
    },
    [isResolved, proposerSafes, nestedOwnerSafes],
  )
}
