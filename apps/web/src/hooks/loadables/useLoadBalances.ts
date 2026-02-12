import { useMemo } from 'react'
import { type Balances, useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { AppBalance } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { useAppSelector } from '@/store'
import { selectCurrency, selectSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { useCurrentChain, useHasFeature } from '../useChains'
import useSafeInfo from '../useSafeInfo'
import useEffectiveSafeParams from '../useEffectiveSafeParams'
import { POLLING_INTERVAL } from '@/config/constants'
import { useCounterfactualBalances } from '@/features/counterfactual/hooks'
import { usePortfolioBalances } from '@/features/portfolio'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

export interface PortfolioBalances extends Balances {
  positions?: AppBalance[]
  tokensFiatTotal?: string
  positionsFiatTotal?: string
  isAllTokensMode?: boolean
}

export const initialBalancesState: PortfolioBalances = {
  items: [],
  fiatTotal: '',
}

export const createPortfolioBalances = (balances: Balances): PortfolioBalances => ({
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
 * Hook to load balances using the Transaction Service endpoint.
 * @param skip - Skip fetching when portfolio endpoint is enabled
 */
export const useTxServiceBalances = (skip = false): AsyncResult<PortfolioBalances> => {
  const currency = useAppSelector(selectCurrency)
  const isTrustedTokenList = useTokenListSetting()
  const { safe, safeLoaded } = useSafeInfo()
  const { effectiveAddress, effectiveChainId } = useEffectiveSafeParams()
  // Assume deployed until safe info confirms otherwise (counterfactual hook handles undeployed)
  const isReady = effectiveAddress && effectiveChainId && isTrustedTokenList !== undefined
  const isCounterfactual = safeLoaded && !safe.deployed

  const {
    currentData: txServiceBalances,
    isLoading: txServiceLoading,
    error: txServiceError,
  } = useBalancesGetBalancesV1Query(
    {
      chainId: effectiveChainId,
      safeAddress: effectiveAddress,
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

    if (txServiceBalances) {
      const error = txServiceError ? new Error(String(txServiceError)) : undefined
      return [createPortfolioBalances(txServiceBalances), error, txServiceLoading]
    }

    const error = txServiceError ? new Error(String(txServiceError)) : undefined
    return [undefined, error, true]
  }, [skip, isCounterfactual, cfData, cfError, cfLoading, txServiceBalances, txServiceError, txServiceLoading])
}

/**
 * Calculates the sum of fiat balances from token items
 */
const calculateTokensFiatTotal = (items: Balances['items']): string => {
  const total = items.reduce((sum, item) => sum + parseFloat(item.fiatBalance || '0'), 0)
  return total.toString()
}

/**
 * Hook to load token balances and positions data.
 *
 * Behavior:
 * - fiatTotal: always from portfolio endpoint (Zerion) when available
 * - Token list: portfolio tokens for "Default tokens", Transaction Service tokens for "All tokens"
 * - tokensFiatTotal: calculated from the displayed token list
 * - positions: always from portfolio endpoint when available
 */
const useLoadBalances = (): AsyncResult<PortfolioBalances> => {
  const settings = useAppSelector(selectSettings)
  const hasPortfolioFeature = useHasFeature(FEATURES.PORTFOLIO_ENDPOINT) ?? false
  const isAllTokensSelected = settings.tokenList === TOKEN_LISTS.ALL

  const portfolioResult = usePortfolioBalances(!hasPortfolioFeature)

  const shouldUseTxServiceForTokenList = !hasPortfolioFeature || isAllTokensSelected
  const txServiceResult = useTxServiceBalances(!shouldUseTxServiceForTokenList)

  return useMemo<AsyncResult<PortfolioBalances>>(() => {
    if (!hasPortfolioFeature) {
      return txServiceResult
    }

    if (!isAllTokensSelected) {
      return portfolioResult
    }

    const [portfolioData, portfolioError, portfolioLoading] = portfolioResult
    const [txServiceData, txServiceError, txServiceLoading] = txServiceResult

    if (portfolioLoading || txServiceLoading) {
      return [undefined, undefined, true]
    }

    const error = portfolioError || txServiceError
    if (error) {
      return [undefined, error, false]
    }

    if (!portfolioData || !txServiceData) {
      return [undefined, undefined, true]
    }

    const mergedBalances: PortfolioBalances = {
      items: txServiceData.items,
      fiatTotal: portfolioData.fiatTotal,
      tokensFiatTotal: calculateTokensFiatTotal(txServiceData.items),
      positionsFiatTotal: portfolioData.positionsFiatTotal,
      positions: portfolioData.positions,
      isAllTokensMode: true,
    }

    return [mergedBalances, undefined, false]
  }, [hasPortfolioFeature, isAllTokensSelected, portfolioResult, txServiceResult])
}

export default useLoadBalances
