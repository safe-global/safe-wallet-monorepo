import { POLLING_INTERVAL } from '@/config/constants'
import { useCounterfactualBalances } from '@/features/counterfactual/useCounterfactualBalances'
import { useAppSelector } from '@/store'
import { selectCurrency, selectSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { FEATURES, hasFeature } from '@/utils/chains'
import { type Balances, useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useMemo } from 'react'
import { type AsyncResult } from '../useAsync'
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

  return useMemo(() => [balances, error, loading], [balances, error, loading]) as AsyncResult<Balances>
}

export default useLoadBalances
