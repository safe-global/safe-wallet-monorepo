import { useMemo } from 'react'
import { type Balances, useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { AppBalance } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { useAppSelector } from '@/store'
import { selectCurrency, selectSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { useCurrentChain, useHasFeature } from '../useChains'
import useSafeInfo from '../useSafeInfo'
import { POLLING_INTERVAL } from '@/config/constants'
import { useCounterfactualBalances } from '@/features/counterfactual/useCounterfactualBalances'
import usePortfolioBalances from '@/features/portfolio/hooks/usePortfolioBalances'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

export interface PortfolioBalances extends Balances {
  positions?: AppBalance[]
  tokensFiatTotal?: string
  positionsFiatTotal?: string
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

  return useMemo(() => {
    if (settings.tokenList === TOKEN_LISTS.ALL) return false
    return chain ? hasFeature(chain, FEATURES.DEFAULT_TOKENLIST) : undefined
  }, [chain, settings.tokenList])
}

/**
 * Hook to load balances using the legacy endpoint.
 * @param skip - Skip fetching when portfolio endpoint is enabled
 */
export const useLegacyBalances = (skip = false): AsyncResult<PortfolioBalances> => {
  const currency = useAppSelector(selectCurrency)
  const isTrustedTokenList = useTokenListSetting()
  const { safe, safeAddress } = useSafeInfo()
  const isReady = safeAddress && safe.deployed && isTrustedTokenList !== undefined
  const isCounterfactual = !safe.deployed

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
      skip: skip || !isReady,
      pollingInterval: POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    },
  )

  const [cfData, cfError, cfLoading] = useCounterfactualBalances(safe)

  return useMemo<AsyncResult<PortfolioBalances>>(() => {
    if (skip) {
      return [undefined, undefined, false]
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
  }, [skip, isCounterfactual, cfData, cfError, cfLoading, legacyBalances, legacyError, legacyLoading])
}

/**
 * Hook to load token balances and positions data.
 * Uses portfolio endpoint when enabled, otherwise falls back to legacy endpoint.
 */
const useLoadBalances = (): AsyncResult<PortfolioBalances> => {
  const shouldUsePortfolioEndpoint = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT) ?? false

  const legacyResult = useLegacyBalances(shouldUsePortfolioEndpoint)
  const portfolioResult = usePortfolioBalances(!shouldUsePortfolioEndpoint)

  return shouldUsePortfolioEndpoint ? portfolioResult : legacyResult
}

export default useLoadBalances
