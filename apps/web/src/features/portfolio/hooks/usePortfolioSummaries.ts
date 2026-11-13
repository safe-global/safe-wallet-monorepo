import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  portfolioSummariesRtkApi,
  usePortfolioGetSummariesForManyQuery,
} from '@safe-global/store/gateway/portfolioSummaries'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import useChains from '@/hooks/useChains'
import { type RootState, useAppSelector } from '@/store'
import { selectCurrency, selectTokenList, type TOKEN_LISTS } from '@/store/settingsSlice'
import { makeSafeOverviewTag, makeSafeTag } from '@/store/api/gateway'
import { isTrustedTokenList } from '@/utils/tokenList'

export type SafeRef = { chainId: string; address: string }

type CachedSummaries = { trusted: boolean; summaries: PortfolioSummary[]; fetchedAt: number }

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

const summaryKey = (trusted: boolean, chainId: string, address: string) =>
  `${trusted}:${makeSafeOverviewTag(chainId, address)}`

// Every cached summaries list in the user's currency, from any screen
const selectCachedSummaries = (state: RootState): CachedSummaries[] => {
  const currency = selectCurrency(state)
  const { util, endpoints } = portfolioSummariesRtkApi
  return util
    .selectCachedArgsForQuery(state, 'portfolioGetSummariesForMany')
    .filter((args) => args.currency === currency)
    .flatMap((args) => {
      const { data, fulfilledTimeStamp } = endpoints.portfolioGetSummariesForMany.select(args)(state)
      return data && fulfilledTimeStamp
        ? [{ trusted: args.trusted, summaries: data, fetchedAt: fulfilledTimeStamp }]
        : []
    })
}

const isSameCache = (a: CachedSummaries[], b: CachedSummaries[]) =>
  a.length === b.length &&
  a.every((entry, i) => entry.summaries === b[i].summaries && entry.fetchedAt === b[i].fetchedAt)

const pickNewest = (cached: CachedSummaries[]) => {
  const newest = new Map<string, { summary: PortfolioSummary; fetchedAt: number }>()
  for (const { trusted, summaries, fetchedAt } of cached) {
    for (const summary of summaries) {
      const key = summaryKey(trusted, summary.chainId, summary.address)
      const current = newest.get(key)
      if (!current || current.fetchedAt < fetchedAt) newest.set(key, { summary, fetchedAt })
    }
  }
  return newest
}

/** Summaries of the Safes on PORTFOLIO_SUMMARIES chains; `getSummary` returns the newest one any screen fetched. */
const usePortfolioSummaries = (safes: SafeRef[]) => {
  const { configs } = useChains()
  const currency = useAppSelector(selectCurrency)
  const tokenList = useAppSelector(selectTokenList)
  const cached = useAppSelector(selectCachedSummaries, isSameCache)

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

  // Not polled: CGW caches the snapshot briefly, so each poll would be a paid Zerion call (see useRefetchBalances)
  const trustedQuery = usePortfolioGetSummariesForManyQuery(
    requestedSafes.trusted.length > 0 ? { safes: requestedSafes.trusted, currency, trusted: true } : skipToken,
  )
  const untrustedQuery = usePortfolioGetSummariesForManyQuery(
    requestedSafes.untrusted.length > 0 ? { safes: requestedSafes.untrusted, currency, trusted: false } : skipToken,
  )

  const newestSummaries = useMemo(() => pickNewest(cached), [cached])

  const isEnabled = useCallback((chainId: string) => enabledChains.has(chainId), [enabledChains])

  const getSummary = useCallback(
    (chainId: string, address: string): PortfolioSummary | undefined => {
      const chain = enabledChains.get(chainId)
      if (!chain) return undefined
      return newestSummaries.get(summaryKey(isTrustedTokenList(chain, tokenList), chainId, address))?.summary
    },
    [enabledChains, newestSummaries, tokenList],
  )

  // currentData, not data: data keeps the previous args' result after a token list, currency or Safe change
  const isLoading =
    (trustedQuery.isFetching && !trustedQuery.currentData) || (untrustedQuery.isFetching && !untrustedQuery.currentData)

  return useMemo(() => ({ isEnabled, getSummary, isLoading }), [isEnabled, getSummary, isLoading])
}

export type PortfolioSummaries = ReturnType<typeof usePortfolioSummaries>

export default usePortfolioSummaries
