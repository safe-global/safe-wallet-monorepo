import { POLLING_INTERVAL } from '@/config/constants'
import { useCounterfactualBalances } from '@/features/counterfactual/useCounterfactualBalances'
import { useIsSafenetEnabled } from '@/features/safenet/hooks/useIsSafenetEnabled'
import { useAppSelector } from '@/store'
import { useGetSafenetBalanceQuery, useGetSafenetConfigQuery } from '@/store/safenet'
import { selectCurrency, selectSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { FEATURES, hasFeature } from '@/utils/chains'
import type { BalancesSafenet } from '@/utils/safenet'
import { convertSafenetBalanceToSafeClientGatewayBalance, mergeBalances } from '@/utils/safenet'
import { skipToken } from '@reduxjs/toolkit/query'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useMemo } from 'react'
import type { AsyncResult } from '../useAsync'
import { useChainId } from '../useChainId'
import { useCurrentChain } from '../useChains'
import useSafeInfo from '../useSafeInfo'

export const useTokenListSetting = (): boolean | undefined => {
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)

  const isTrustedTokenList = useMemo(() => {
    if (settings.tokenList === TOKEN_LISTS.ALL) return false
    return chain ? hasFeature(chain, FEATURES.DEFAULT_TOKENLIST) : undefined
  }, [chain, settings.tokenList])

  return isTrustedTokenList
}

const useLoadBalances = () => {
  const currency = useAppSelector(selectCurrency)
  const isTrustedTokenList = useTokenListSetting()
  const { safe, safeAddress } = useSafeInfo()
  const chainId = useChainId()

  const isReady = safeAddress && safe.deployed && isTrustedTokenList !== undefined
  const isCounterfactual = !safe.deployed

  const isSafenetEnabled = useIsSafenetEnabled()
  const { data: safenetConfig } = useGetSafenetConfigQuery(!isSafenetEnabled || !isReady ? skipToken : undefined)

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

  let error = useMemo(() => (errorStr ? new Error(errorStr.toString()) : undefined), [errorStr])

  // Counterfactual balances
  const [cfData, cfError, cfLoading] = useCounterfactualBalances(safe)

  if (isCounterfactual) {
    balances = cfData
    loading = cfLoading
    error = cfError
  }

  // Safenet balances
  const {
    data: safenetBalanceData,
    isLoading: safenetBalanceLoading,
    error: safenetError,
  } = useGetSafenetBalanceQuery(
    { safeAddress },
    { skip: !isSafenetEnabled || !isReady, pollingInterval: POLLING_INTERVAL },
  )

  let safenetBalanceError = useMemo(
    () => (safenetError ? new Error(safenetError.toString()) : undefined),
    [safenetError],
  )

  const mergedSafenetBalance = useMemo(() => {
    if (!isSafenetEnabled || !safenetConfig || !safenetBalanceData) return
    const convertedBalance = convertSafenetBalanceToSafeClientGatewayBalance(
      safenetBalanceData,
      safenetConfig,
      Number(chainId),
      currency,
    )
    return balances ? mergeBalances(balances, convertedBalance) : convertedBalance
  }, [isSafenetEnabled, safenetBalanceData, safenetConfig, chainId, currency, balances])

  if (mergedSafenetBalance) {
    balances = mergedSafenetBalance
  }

  return useMemo(
    () => [balances, error || safenetBalanceError, loading || safenetBalanceLoading],
    [balances, error, safenetBalanceError, loading, safenetBalanceLoading],
  ) as AsyncResult<BalancesSafenet>
}

export default useLoadBalances
