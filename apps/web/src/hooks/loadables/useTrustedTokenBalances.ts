import { useMemo } from 'react'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useSafeInfo from '../useSafeInfo'
import { POLLING_INTERVAL } from '@/config/constants'
import { useCounterfactualBalances } from '@/features/counterfactual/useCounterfactualBalances'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { type PortfolioBalances, createPortfolioBalances, useTokenListSetting } from './useLoadBalances'

/**
 * Hook to load balances using the legacy endpoint with trusted tokenlist.
 * Always uses the legacy endpoint regardless of portfolio endpoint status or user settings.
 * Used specifically for the send flow to ensure consistent token availability.
 */
export const useTrustedTokenBalances = (): AsyncResult<PortfolioBalances> => {
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
      skip: !isReady,
      pollingInterval: POLLING_INTERVAL,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    },
  )

  const [cfData, cfError, cfLoading] = useCounterfactualBalances(safe)

  return useMemo<AsyncResult<PortfolioBalances>>(() => {
    if (isCounterfactual && cfData) {
      return [createPortfolioBalances(cfData), cfError, cfLoading]
    }

    if (legacyBalances) {
      const error = legacyError ? new Error(String(legacyError)) : undefined
      return [createPortfolioBalances(legacyBalances), error, legacyLoading]
    }

    const error = legacyError ? new Error(String(legacyError)) : undefined
    return [undefined, error, true]
  }, [isCounterfactual, cfData, cfError, cfLoading, legacyBalances, legacyError, legacyLoading])
}
