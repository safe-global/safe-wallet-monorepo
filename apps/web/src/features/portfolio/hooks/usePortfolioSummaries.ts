import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { usePortfolioGetSummariesForManyQuery } from '@safe-global/store/gateway/portfolioSummaries'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { type FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import useChains from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { makeSafeOverviewTag, makeSafeTag } from '@/store/api/gateway'

export const PORTFOLIO_SUMMARIES_POLLING_INTERVAL = 60_000

type SafeRef = { chainId: string; address: string }

/**
 * Fetches CGW portfolio summaries for the Safes whose chain has `feature` enabled.
 * A Safe on a chain without the flag is not requested, so its caller keeps its current source.
 */
const usePortfolioSummaries = (safes: SafeRef[], feature: FEATURES) => {
  const { configs } = useChains()
  const currency = useAppSelector(selectCurrency)

  const enabledChainIds = useMemo(
    () => new Set(configs.filter((chain) => hasFeature(chain, feature)).map((chain) => chain.chainId)),
    [configs, feature],
  )

  const requestedSafes = useMemo(
    () =>
      safes
        .filter((safe) => enabledChainIds.has(safe.chainId))
        .map((safe) => makeSafeTag(safe.chainId, safe.address))
        .sort(),
    [safes, enabledChainIds],
  )

  const { data, isLoading } = usePortfolioGetSummariesForManyQuery(
    requestedSafes.length > 0 ? { safes: requestedSafes, currency } : skipToken,
    { pollingInterval: PORTFOLIO_SUMMARIES_POLLING_INTERVAL, skipPollingIfUnfocused: true },
  )

  const summariesByTag = useMemo(
    () => new Map(data?.map((summary) => [makeSafeOverviewTag(summary.chainId, summary.address), summary])),
    [data],
  )

  const isEnabled = useCallback((chainId: string) => enabledChainIds.has(chainId), [enabledChainIds])

  const getSummary = useCallback(
    (chainId: string, address: string): PortfolioSummary | undefined =>
      summariesByTag.get(makeSafeOverviewTag(chainId, address)),
    [summariesByTag],
  )

  return useMemo(() => ({ isEnabled, getSummary, isLoading }), [isEnabled, getSummary, isLoading])
}

export default usePortfolioSummaries
