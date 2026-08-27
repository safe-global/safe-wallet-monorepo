import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { flattenSafeItems } from '@/hooks/safes'
import useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { useGetMultipleSafeOverviewsQuery, useGetProposerSafesQuery } from '@/store/api/gateway'
import { selectCurrency } from '@/store/settingsSlice'
import { useSpaceSafes } from '../../../../hooks/useSpaceSafes'
import { buildSafeAccountId, groupSafeAccounts } from '../utils'
import type { ChainInfo } from '@/features/spaces/types'
import type { SafeAccountEligibility, SafeAccountEntry, SafeAccountOption } from '../types'

const overviewKey = (chainId: string, address: string) => `${chainId}:${address.toLowerCase()}`

const getEligibility = (isSigner: boolean, isProposer: boolean): SafeAccountEligibility => {
  if (isSigner && isProposer) return 'signer-and-proposer'
  return isSigner ? 'signer' : 'proposer'
}

/**
 /**
 * Safes in the current Space on which the connected wallet is a signer or a proposer, grouped by
 * address. Ineligible Safes are absent rather than disabled.
 */

 * address. Ineligible Safes are absent rather than disabled.
 */
export const useEligibleSafeAccounts = () => {
  const {
    allSafes,
    isLoading: isSafesLoading,
    isError: isSafesError,
    refetch: refetchSpaceSafes,
    isUninitialized: isSpaceSafesUninitialized,
  } = useSpaceSafes()
  const { address: wallet = '' } = useWallet() || {}
  const currency = useAppSelector(selectCurrency)
  const { configs: chains } = useChains()

  const safeItems = useMemo(() => flattenSafeItems(allSafes), [allSafes])

  // Same args as `useSpaceSafeOverviews`, so this shares its cache entry instead of costing a request.
  const overviewSafes = useMemo(() => safeItems.map(({ chainId, address }) => ({ chainId, address })), [safeItems])
  const overviewsQuery = useGetMultipleSafeOverviewsQuery(
    overviewSafes.length > 0 ? { safes: overviewSafes, currency } : skipToken,
  )

  // One delegates request per distinct chain the Space actually uses, not one per Safe.
  const chainIds = useMemo(() => Array.from(new Set(safeItems.map((item) => item.chainId))), [safeItems])
  const proposerSafesQuery = useGetProposerSafesQuery(
    wallet && chainIds.length > 0 ? { chainIds, delegate: wallet } : skipToken,
  )

  // A delegates failure only under-reports proposer access, so it degrades instead of failing the field.
  const isError = isSafesError || overviewsQuery.isError

  // `currentData`: `data` still holds the previous args' result while a new key is in flight.
  const overviews = overviewsQuery.currentData
  const proposerSafes = proposerSafesQuery.currentData

  const isOverviewsResolved = overviewSafes.length === 0 || overviews !== undefined || overviewsQuery.isError
  const isProposerStatusResolved =
    chainIds.length === 0 ||
    proposerSafesQuery.isUninitialized ||
    proposerSafes !== undefined ||
    proposerSafesQuery.isError

  // `isReadOnly` is fail-closed until the overviews land, so stay loading rather than flash an empty list.
  const isLoading = !!wallet && (isSafesLoading || (!isError && (!isOverviewsResolved || !isProposerStatusResolved)))

  const overviewsByKey = useMemo(() => {
    const map = new Map<string, SafeOverview>()
    for (const overview of overviews ?? []) {
      map.set(overviewKey(overview.chainId, overview.address.value), overview)
    }
    return map
  }, [overviews])

  // Resolved here, not per row: a group header renders every chain and cannot call a hook in that loop.
  const chainsById = useMemo(() => {
    const map = new Map<string, ChainInfo>()
    for (const chain of chains) {
      const { chainId, chainName, chainLogoUri, shortName } = chain
      map.set(chainId, { chainId, chainName, chainLogoUri, shortName })
    }
    return map
  }, [chains])

  const accounts = useMemo<SafeAccountEntry[]>(() => {
    if (!wallet || isLoading) return []

    const options = safeItems.flatMap<SafeAccountOption>((item) => {
      const isSigner = !item.isReadOnly
      const isProposer = (proposerSafes?.[item.chainId] ?? []).some((safe) => sameAddress(safe, item.address))

      if (!isSigner && !isProposer) return []

      const overview = overviewsByKey.get(overviewKey(item.chainId, item.address))

      return [
        {
          id: buildSafeAccountId(item.chainId, item.address),
          chainId: item.chainId,
          address: item.address,
          name: item.name,
          threshold: overview?.threshold,
          owners: overview?.owners.length,
          eligibility: getEligibility(isSigner, isProposer),
          chain: chainsById.get(item.chainId),
          fiatTotal: overview?.fiatTotal,
        },
      ]
    })

    return groupSafeAccounts(options)
  }, [wallet, isLoading, safeItems, proposerSafes, overviewsByKey, chainsById])

  // Destructured for stable deps: the whole query objects would hand consumers a new `onRetry` per render.
  const { refetch: refetchOverviews, isUninitialized: isOverviewsUninitialized } = overviewsQuery
  const { refetch: refetchProposerSafes, isUninitialized: isProposerSafesUninitialized } = proposerSafesQuery

  // All three skip in normal states, and `refetch()` throws on a query that never started.
  const refetch = useCallback(() => {
    if (!isSpaceSafesUninitialized) refetchSpaceSafes()
    if (!isOverviewsUninitialized) refetchOverviews()
    if (!isProposerSafesUninitialized) refetchProposerSafes()
  }, [
    isSpaceSafesUninitialized,
    refetchSpaceSafes,
    refetchOverviews,
    isOverviewsUninitialized,
    refetchProposerSafes,
    isProposerSafesUninitialized,
  ])

  return { accounts, isLoading, isError, hasWallet: !!wallet, refetch }
}
