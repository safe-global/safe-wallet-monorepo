import { useMemo } from 'react'
import { type Balances, useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import {
  usePortfolioGetPortfolioV1Query,
  type Portfolio,
  type AppBalance,
} from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { useAppSelector } from '@/store'
import { selectCurrency, selectSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { useCurrentChain, useHasFeature } from '../useChains'
import useSafeInfo from '../useSafeInfo'
import { POLLING_INTERVAL, PORTFOLIO_POLLING_INTERVAL } from '@/config/constants'
import { useCounterfactualBalances } from '@/features/counterfactual/useCounterfactualBalances'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

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

const createPortfolioBalances = (balances: Balances): PortfolioBalances => ({
  ...balances,
  tokensFiatTotal: balances.fiatTotal,
  positionsFiatTotal: '0',
  positions: undefined,
})

export const useTokenListSetting = (): boolean | undefined => {
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)

  const isTrustedTokenList = useMemo(() => {
    if (settings.tokenList === TOKEN_LISTS.ALL) return false
    return chain ? hasFeature(chain, FEATURES.DEFAULT_TOKENLIST) : undefined
  }, [chain, settings.tokenList])

  return isTrustedTokenList
}

export interface PortfolioBalances extends Balances {
  positions?: AppBalance[]
  tokensFiatTotal?: string
  positionsFiatTotal?: string
}

/**
 * Hook to load token balances and positions data.
 * Returns `loading: true` when initialized, even if the query is skipped (e.g., no Safe selected).
 */
const useLoadBalances = (): AsyncResult<PortfolioBalances> => {
  const currency = useAppSelector(selectCurrency)
  const settings = useAppSelector(selectSettings)
  const isTrustedTokenList = useTokenListSetting()
  const { safe, safeAddress } = useSafeInfo()
  const isReady = safeAddress && safe.deployed && isTrustedTokenList !== undefined
  const isReadyPortfolio = safeAddress && isTrustedTokenList !== undefined
  const isCounterfactual = !safe.deployed
  const hideDust = settings.hideDust ?? true

  const shouldUsePortfolioEndpoint = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT) ?? false

  const {
    currentData: legacyBalances,
    isLoading: legacyLoading,
    error: legacyError,
  } = useBalancesGetBalancesV1Query(
    {
      chainId: safe.chainId,
      safeAddress,
      fiatCode: currency,
      trusted: isTrustedTokenList,
    },
    {
      skip: !isReady || shouldUsePortfolioEndpoint,
      pollingInterval: POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    },
  )

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
      excludeDust: hideDust,
    },
    {
      skip: !shouldUsePortfolioEndpoint || !isReadyPortfolio || !safe.chainId,
      pollingInterval: PORTFOLIO_POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    },
  )

  const [cfData, cfError, cfLoading] = useCounterfactualBalances(safe)

  const memoizedPortfolioBalances = useMemo(() => transformPortfolioToBalances(portfolioData), [portfolioData])

  const isPortfolioEmpty = useMemo(() => {
    if (!portfolioData) return false
    return portfolioData.tokenBalances.length === 0 && portfolioData.positionBalances.length === 0
  }, [portfolioData])

  const result = useMemo<AsyncResult<PortfolioBalances>>(() => {
    if (shouldUsePortfolioEndpoint) {
      if (isCounterfactual && isPortfolioEmpty) {
        if (cfData) {
          return [createPortfolioBalances(cfData), cfError, cfLoading]
        }
        const emptyBalances: Balances = {
          items: [],
          fiatTotal: '0',
        }
        return [createPortfolioBalances(emptyBalances), cfError, false]
      }
      const error = portfolioError ? new Error(String(portfolioError)) : undefined
      return [memoizedPortfolioBalances, error, portfolioLoading]
    }

    if (isCounterfactual && cfData) {
      return [createPortfolioBalances(cfData), cfError, cfLoading]
    }

    if (legacyBalances) {
      const error = legacyError ? new Error(String(legacyError)) : undefined
      return [createPortfolioBalances(legacyBalances), error, legacyLoading]
    }

    const error = legacyError ? new Error(String(legacyError)) : undefined
    return [undefined, error, true]
  }, [
    shouldUsePortfolioEndpoint,
    isCounterfactual,
    isPortfolioEmpty,
    cfData,
    cfError,
    cfLoading,
    memoizedPortfolioBalances,
    portfolioError,
    portfolioLoading,
    legacyBalances,
    legacyError,
    legacyLoading,
  ])

  return result
}

export default useLoadBalances
