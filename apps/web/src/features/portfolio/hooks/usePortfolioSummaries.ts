import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { usePortfolioGetSummariesForManyQuery } from '@safe-global/store/gateway/portfolioSummaries'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import useChains from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectCurrency, selectTokenList, type TOKEN_LISTS } from '@/store/settingsSlice'
import { makeSafeOverviewTag, makeSafeTag } from '@/store/api/gateway'
import { isTrustedTokenList } from '@/utils/tokenList'

export const PORTFOLIO_SUMMARIES_POLLING_INTERVAL = 60_000

type SafeRef = { chainId: string; address: string }

const toSortedSafeIds = (safes: SafeRef[]): string[] =>
  Array.from(new Set(safes.map((safe) => makeSafeTag(safe.chainId, safe.address)))).sort()

const splitByTrusted = (safes: SafeRef[], enabledChains: Map<string, Chain>, tokenList: TOKEN_LISTS) => {
  const enabledSafes = safes.filter((safe) => enabledChains.has(safe.chainId))
  const isTrusted = (safe: SafeRef) => {
    const chain = enabledChains.get(safe.chainId)
    return chain !== undefined && isTrustedTokenList(chain, tokenList)
  }
  return {
    trusted: toSortedSafeIds(enabledSafes.filter(isTrusted)),
    untrusted: toSortedSafeIds(enabledSafes.filter((safe) => !isTrusted(safe))),
  }
}

/**
 * Fetches CGW portfolio summaries for the Safes whose chain has PORTFOLIO_SUMMARIES enabled.
 * A Safe on a chain without the flag is not requested, so its caller keeps its current source.
 * Each Safe is requested with the `trusted` value its chain sends to /v1/portfolio, so both read one Zerion snapshot.
 */
const usePortfolioSummaries = (safes: SafeRef[]) => {
  const { configs } = useChains()
  const currency = useAppSelector(selectCurrency)
  const tokenList = useAppSelector(selectTokenList)

  const enabledChains = useMemo(
    () =>
      new Map(
        configs
          .filter((chain) => hasFeature(chain, FEATURES.PORTFOLIO_SUMMARIES))
          .map((chain) => [chain.chainId, chain]),
      ),
    [configs],
  )

  const requestedSafes = useMemo(
    () => splitByTrusted(safes, enabledChains, tokenList),
    [safes, enabledChains, tokenList],
  )

  const queryOptions = { pollingInterval: PORTFOLIO_SUMMARIES_POLLING_INTERVAL, skipPollingIfUnfocused: true }
  const trustedQuery = usePortfolioGetSummariesForManyQuery(
    requestedSafes.trusted.length > 0 ? { safes: requestedSafes.trusted, currency, trusted: true } : skipToken,
    queryOptions,
  )
  const untrustedQuery = usePortfolioGetSummariesForManyQuery(
    requestedSafes.untrusted.length > 0 ? { safes: requestedSafes.untrusted, currency, trusted: false } : skipToken,
    queryOptions,
  )

  const summariesByTag = useMemo(
    () =>
      new Map(
        [...(trustedQuery.data ?? []), ...(untrustedQuery.data ?? [])].map((summary) => [
          makeSafeOverviewTag(summary.chainId, summary.address),
          summary,
        ]),
      ),
    [trustedQuery.data, untrustedQuery.data],
  )

  const isEnabled = useCallback((chainId: string) => enabledChains.has(chainId), [enabledChains])

  const getSummary = useCallback(
    (chainId: string, address: string): PortfolioSummary | undefined =>
      summariesByTag.get(makeSafeOverviewTag(chainId, address)),
    [summariesByTag],
  )

  const isLoading = trustedQuery.isLoading || untrustedQuery.isLoading

  return useMemo(() => ({ isEnabled, getSummary, isLoading }), [isEnabled, getSummary, isLoading])
}

export default usePortfolioSummaries
