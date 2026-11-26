import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import type { SafeItem } from '@safe-global/views/hooks/safes/types'
import useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { useGetMultipleSafeOverviewsQuery, useGetProposerSafesQuery } from '@/store/api/gateway'
import { selectCurrency } from '@/store/settingsSlice'

type SafeRef = Pick<SafeItem, 'chainId' | 'address'>

export const safeKey = (chainId: string, address: string) => `${chainId}:${address.toLowerCase()}`

// Overview args match `useSpaceSafeOverviews` so they share its cache entry; one delegates request per chain
export const useSafeRoleQueries = (safes: SafeRef[], { skipProposers = false }: { skipProposers?: boolean } = {}) => {
  const { address: wallet = '' } = useWallet() || {}
  const currency = useAppSelector(selectCurrency)
  const { configs: chains, loading: isChainsLoading } = useChains()

  const overviewSafes = useMemo(() => safes.map(({ chainId, address }) => ({ chainId, address })), [safes])
  const overviewsQuery = useGetMultipleSafeOverviewsQuery(
    overviewSafes.length > 0 ? { safes: overviewSafes, currency } : skipToken,
  )

  const proposerChains = useMemo(() => {
    const chainIds = new Set(safes.map((safe) => safe.chainId))
    return chains.filter((chain) => chainIds.has(chain.chainId))
  }, [chains, safes])
  const proposerSafesQuery = useGetProposerSafesQuery(
    !skipProposers && wallet && proposerChains.length > 0 ? { chains: proposerChains, delegate: wallet } : skipToken,
  )

  // `currentData`: `data` still holds the previous args' result while a new key is in flight.
  const overviews = overviewsQuery.currentData
  const proposerSafes = proposerSafesQuery.currentData
  const isOverviewsError = overviewsQuery.isError

  const isOverviewsResolved = safes.length === 0 || overviews !== undefined || isOverviewsError
  // A skipped query only means "no proposer Safes" once the chain configs it is built from have loaded.
  const isProposerResolved =
    proposerSafes !== undefined ||
    proposerSafesQuery.isError ||
    (proposerSafesQuery.isUninitialized && (skipProposers || !isChainsLoading))

  const { refetch: refetchOverviews, isUninitialized: isOverviewsUninitialized } = overviewsQuery
  const { refetch: refetchProposerSafes, isUninitialized: isProposerSafesUninitialized } = proposerSafesQuery

  // `refetch()` throws on a query that never started.
  const refetch = useCallback(() => {
    if (!isOverviewsUninitialized) refetchOverviews()
    if (!isProposerSafesUninitialized) refetchProposerSafes()
  }, [isOverviewsUninitialized, refetchOverviews, isProposerSafesUninitialized, refetchProposerSafes])

  return { overviews, proposerSafes, isOverviewsResolved, isProposerResolved, isOverviewsError, refetch }
}
