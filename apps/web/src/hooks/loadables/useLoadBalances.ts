import { useMemo } from 'react'
import { type Balances, useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useAppSelector } from '@/store'
import { type AsyncResult } from '../useAsync'
import { selectCurrency, selectSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { useCurrentChain } from '../useChains'
import { FEATURES, hasFeature } from '@/utils/chains'
import useSafeInfo from '../useSafeInfo'
import { POLLING_INTERVAL } from '@/config/constants'
import { useCounterfactualBalances } from '@/features/counterfactual/useCounterfactualBalances'
import { useGetSafenetBalanceQuery, useGetSafenetConfigQuery } from '@/store/safenet'
import useIsSafenetEnabled from '@/features/safenet/hooks/useIsSafenetEnabled'
import { skipToken } from '@reduxjs/toolkit/query'
import { convertSafenetBalanceToSafeClientGatewayBalance } from '@/utils/safenet'

export const useTokenListSetting = (): boolean | undefined => {
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)

  const isTrustedTokenList = useMemo(() => {
    if (settings.tokenList === TOKEN_LISTS.ALL) return false
    return chain ? hasFeature(chain, FEATURES.DEFAULT_TOKENLIST) : undefined
  }, [chain, settings.tokenList])

  return isTrustedTokenList
}

const mergeBalances = (cgw: Balances | undefined, sn: Balances): Balances => {
  // Create a Map using token addresses as keys
  const uniqueBalances = new Map(
    // Process Safenet items last so they take precedence by overwriting the CGW items
    [...(cgw?.items ?? []), ...sn.items].map((item) => [item.tokenInfo.address, item]),
  )

  return {
    // We do not sum the fiatTotal as Safenet doesn't return it
    // And if it did, we would have to do something fancy with calculations so balances aren't double counted
    fiatTotal: Array.from(uniqueBalances.values())
      .reduce((acc, item) => acc + parseFloat(item.fiatBalance), 0)
      .toString(),
    items: Array.from(uniqueBalances.values()),
  }
}

const useLoadBalances = () => {
  const currency = useAppSelector(selectCurrency)
  const isTrustedTokenList = useTokenListSetting()
  const { safe, safeAddress } = useSafeInfo()
  const isSafenetEnabled = useIsSafenetEnabled()
  const isReady = safeAddress && safe.deployed && isTrustedTokenList !== undefined
  const isCounterfactual = !safe.deployed

  let {
    data: balances,
    isLoading: loading,
    error: errorStr,
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
    },
  )

  // Counterfactual balances
  const [cfData, cfError, cfLoading] = useCounterfactualBalances(safe)
  let error = useMemo(() => (errorStr ? new Error(errorStr.toString()) : undefined), [errorStr])

  if (isCounterfactual) {
    balances = cfData as unknown as Balances
    loading = cfLoading
    error = cfError
  }
  const { data: safenetBalances } = useGetSafenetBalanceQuery(isSafenetEnabled ? { safeAddress } : skipToken, {
    pollingInterval: POLLING_INTERVAL,
  })
  const { data: safenetConfig } = useGetSafenetConfigQuery(isSafenetEnabled ? undefined : skipToken)

  const mergedBalances = useMemo(() => {
    if (safenetBalances && safenetConfig) {
      const convertedBalances = convertSafenetBalanceToSafeClientGatewayBalance(
        safenetBalances,
        safenetConfig,
        Number(safe.chainId),
        currency,
      )
      return mergeBalances(balances, convertedBalances)
    } else {
      return balances
    }
  }, [balances, currency, safe.chainId, safenetBalances, safenetConfig])

  return useMemo(() => [mergedBalances, error, loading], [mergedBalances, error, loading]) as AsyncResult<Balances>
}

export default useLoadBalances
