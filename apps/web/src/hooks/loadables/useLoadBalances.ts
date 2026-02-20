import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { selectCurrency, selectSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { useCurrentChain, useHasFeature } from '../useChains'
import useSafeInfo from '../useSafeInfo'
import { POLLING_INTERVAL } from '@/config/constants'
import { useCounterfactualBalances } from '@/features/counterfactual/hooks'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import useTotalBalances from '@safe-global/utils/hooks/useTotalBalances'
import type { PortfolioBalances } from '@safe-global/utils/hooks/portfolioBalances'

// Re-export shared types and helpers for backward compatibility
export type { PortfolioBalances } from '@safe-global/utils/hooks/portfolioBalances'
export { initialBalancesState, createPortfolioBalances } from '@safe-global/utils/hooks/portfolioBalances'

export const useTokenListSetting = (): boolean | undefined => {
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)

  return useMemo(() => {
    if (settings.tokenList === TOKEN_LISTS.ALL) return false
    return chain ? hasFeature(chain, FEATURES.DEFAULT_TOKENLIST) : undefined
  }, [chain, settings.tokenList])
}

/**
 * Hook to load token balances and positions data.
 *
 * Thin wrapper around the shared useTotalBalances hook, providing
 * web-specific values (safe info, currency, token list settings, counterfactual handling).
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
  const isTrustedTokenList = useTokenListSetting()
  const { safe, safeAddress } = useSafeInfo()
  const currency = useAppSelector(selectCurrency)
  const counterfactualResult = useCounterfactualBalances(safe)

  const { data, error, loading } = useTotalBalances({
    safeAddress,
    chainId: safe.chainId,
    currency,
    trusted: isTrustedTokenList,
    hasPortfolioFeature,
    isAllTokensSelected,
    isDeployed: safe.deployed,
    counterfactualResult,
    txServicePollingInterval: POLLING_INTERVAL,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true,
  })

  return [data, error, loading]
}

export default useLoadBalances
