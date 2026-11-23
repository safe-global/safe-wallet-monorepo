import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import type { SafeItem } from '@safe-global/views/hooks/safes/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useOwnersGetAllSafesByOwnerV2Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { useSafeRoleQueries } from './useSafeRoleQueries'

export type SafeSignerStatus = 'signer' | 'pending' | 'not-signer'

const safeKey = (chainId: string, address: string) => `${chainId}:${address.toLowerCase()}`

// Spending-limit-only beneficiaries are not signers: the scoped transfer flow can't use the allowance (TokenTransfer/utils.ts)
export const useSafeSignerCheck = (safes: SafeItem[], enabled: boolean) => {
  const { address: wallet = '' } = useWallet() || {}
  const { loading: isChainsLoading } = useChains()
  const shouldCheck = enabled && !!wallet
  const { overviewsQuery, proposerSafesQuery } = useSafeRoleQueries(safes, { skip: !shouldCheck })

  // Not `useAllOwnedSafes`: its error slot is never undefined, so it can't tell "loading" from "failed".
  const ownedSafesQuery = useOwnersGetAllSafesByOwnerV2Query(shouldCheck ? { ownerAddress: wallet } : skipToken)

  const overviews = overviewsQuery.currentData
  const proposerSafes = proposerSafesQuery.currentData
  const ownedSafes = ownedSafesQuery.currentData

  const isOverviewsResolved = overviews !== undefined || overviewsQuery.isError
  const isProposerResolved =
    proposerSafes !== undefined ||
    proposerSafesQuery.isError ||
    (proposerSafesQuery.isUninitialized && !isChainsLoading)
  const isOwnedResolved = ownedSafes !== undefined || ownedSafesQuery.isError
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
