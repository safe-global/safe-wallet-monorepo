import { useMemo } from 'react'
import { usePortfolioGetPortfolioV1Query, type Portfolio } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useEffectiveSafeParams from '@/hooks/useEffectiveSafeParams'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useTxServiceBalances, useTokenListSetting, type PortfolioBalances } from '@/hooks/loadables/useLoadBalances'

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
 * Hook to load balances using the portfolio endpoint with Transaction Service fallback.
 * Falls back to Transaction Service endpoint if portfolio returns empty data for deployed Safes.
 * Note: Portfolio endpoint supports counterfactual (undeployed) Safes natively.
 * @param skip - Skip fetching when portfolio endpoint is disabled
 */
const usePortfolioBalances = (skip = false): AsyncResult<PortfolioBalances> => {
  const currency = useAppSelector(selectCurrency)
  const isTrustedTokenList = useTokenListSetting()
  const { effectiveAddress, effectiveChainId } = useEffectiveSafeParams()
  const isReadyPortfolio = effectiveAddress && effectiveChainId && isTrustedTokenList !== undefined

  // Portfolio endpoint (called first)
  const {
    currentData: portfolioData,
    isLoading: portfolioLoading,
    error: portfolioError,
  } = usePortfolioGetPortfolioV1Query(
    {
      address: effectiveAddress,
      chainIds: effectiveChainId,
      fiatCode: currency,
      trusted: isTrustedTokenList,
    },
    {
      skip: skip || !isReadyPortfolio,
    },
  )

  // Check if portfolio failed or returned empty data (need fallback)
  const isPortfolioEmpty =
    portfolioData && portfolioData.tokenBalances.length === 0 && portfolioData.positionBalances.length === 0
  const needsTxServiceFallback = !skip && !portfolioLoading && (portfolioError || isPortfolioEmpty)

  // Transaction Service endpoint: reuse useTxServiceBalances hook as fallback
  const [txServiceBalances, txServiceError, txServiceLoading] = useTxServiceBalances(!needsTxServiceFallback)

  const memoizedPortfolioBalances = useMemo(() => transformPortfolioToBalances(portfolioData), [portfolioData])

  return useMemo<AsyncResult<PortfolioBalances>>(() => {
    if (skip) {
      return [undefined, undefined, false]
    }

    // Portfolio failed or returned empty for deployed Safe - fallback to Transaction Service
    if (needsTxServiceFallback) {
      // Return Transaction Service result (includes counterfactual handling)
      return [txServiceBalances, txServiceError, txServiceLoading]
    }

    const error = portfolioError ? new Error(String(portfolioError)) : undefined
    // Show loading when we don't have data yet (initial load or safe switch)
    // but not during polling refreshes when we already have cached data
    const isInitialLoading = !memoizedPortfolioBalances && !error
    return [memoizedPortfolioBalances, error, portfolioLoading || isInitialLoading]
  }, [
    skip,
    needsTxServiceFallback,
    memoizedPortfolioBalances,
    portfolioError,
    portfolioLoading,
    txServiceBalances,
    txServiceError,
    txServiceLoading,
  ])
}

export default usePortfolioBalances
