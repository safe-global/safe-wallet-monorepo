import { useMemo } from 'react'
import { usePortfolioGetPortfolioV1Query, type Portfolio } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import { PORTFOLIO_POLLING_INTERVAL } from '@/config/constants'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useLegacyBalances, useTokenListSetting, type PortfolioBalances } from '@/hooks/loadables/useLoadBalances'

const transformPortfolioToBalances = (portfolio?: Portfolio): PortfolioBalances | undefined => {
  if (!portfolio) return undefined

  return {
    items: portfolio.tokenBalances.map((token) => ({
      tokenInfo: {
        ...token.tokenInfo,
        logoUri: token.tokenInfo.logoUri || '',
      },
      balance: token.balance,
      fiatBalance: token.balanceFiat || '0',
      fiatConversion: token.price || '0',
      fiatBalance24hChange: token.priceChangePercentage1d,
    })),
    fiatTotal: portfolio.totalBalanceFiat,
    tokensFiatTotal: portfolio.totalTokenBalanceFiat,
    positionsFiatTotal: portfolio.totalPositionsBalanceFiat,
    positions: portfolio.positionBalances,
  }
}

/**
 * Hook to load balances using the portfolio endpoint with legacy fallback.
 * Falls back to legacy endpoint if portfolio returns empty data for deployed Safes.
 * Note: Portfolio endpoint supports counterfactual (undeployed) Safes natively.
 * @param skip - Skip fetching when portfolio endpoint is disabled
 */
const usePortfolioBalances = (skip = false): AsyncResult<PortfolioBalances> => {
  const currency = useAppSelector(selectCurrency)
  const isTrustedTokenList = useTokenListSetting()
  const { safe, safeAddress } = useSafeInfo()
  const isReadyPortfolio = safeAddress && isTrustedTokenList !== undefined

  // Portfolio endpoint (called first)
  const {
    currentData: portfolioData,
    isLoading: portfolioLoading,
    error: portfolioError,
  } = usePortfolioGetPortfolioV1Query(
    {
      address: safeAddress,
      chainIds: safe.chainId,
      fiatCode: currency,
      trusted: isTrustedTokenList,
    },
    {
      skip: skip || !isReadyPortfolio || !safe.chainId,
      pollingInterval: PORTFOLIO_POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    },
  )

  // Check if portfolio failed or returned empty data for deployed Safes (need legacy fallback)
  const isPortfolioEmpty =
    portfolioData && portfolioData.tokenBalances.length === 0 && portfolioData.positionBalances.length === 0
  const needsLegacyFallback = !skip && !portfolioLoading && (portfolioError || (isPortfolioEmpty && safe.deployed))

  // Legacy endpoint: reuse useLegacyBalances hook as fallback
  const [legacyBalances, legacyError, legacyLoading] = useLegacyBalances(!needsLegacyFallback)

  const memoizedPortfolioBalances = useMemo(() => transformPortfolioToBalances(portfolioData), [portfolioData])

  return useMemo<AsyncResult<PortfolioBalances>>(() => {
    if (skip) {
      return [undefined, undefined, false]
    }

    // Portfolio failed or returned empty for deployed Safe - fallback to legacy
    if (needsLegacyFallback) {
      // Return legacy result (includes counterfactual handling)
      return [legacyBalances, legacyError, legacyLoading]
    }

    const error = portfolioError ? new Error(String(portfolioError)) : undefined
    // Show loading when we don't have data yet (initial load or safe switch)
    // but not during polling refreshes when we already have cached data
    const isInitialLoading = !memoizedPortfolioBalances && !error
    return [memoizedPortfolioBalances, error, portfolioLoading || isInitialLoading]
  }, [
    skip,
    needsLegacyFallback,
    memoizedPortfolioBalances,
    portfolioError,
    portfolioLoading,
    legacyBalances,
    legacyError,
    legacyLoading,
  ])
}

export default usePortfolioBalances
