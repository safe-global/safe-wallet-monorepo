import { useEffect, useMemo } from 'react'
import { type Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { getBalances } from '@safe-global/safe-gateway-typescript-sdk'
import { useAppSelector } from '@/store'
import useAsync, { type AsyncResult } from '../useAsync'
import { selectCurrency, selectSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { useCurrentChain } from '../useChains'
import { FEATURES, hasFeature } from '@/utils/chains'
import useSafeInfo from '../useSafeInfo'
import { POLLING_INTERVAL } from '@/config/constants'
import { useCounterfactualBalances } from '@/features/counterfactual/useCounterfactualBalances'
import useIntervalCounter from '../useIntervalCounter'

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
  const { chainId } = safe
  const isReady = safeAddress && safe.deployed && isTrustedTokenList !== undefined
  const isCounterfactual = !safe.deployed
  const [count, resetPolling] = useIntervalCounter(POLLING_INTERVAL)

  let [data, error, loading] = useAsync<Balances>(
    () => {
      if (!isReady) return
      return getBalances(chainId, safeAddress, currency, { trusted: isTrustedTokenList }) as Promise<Balances>
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [safeAddress, chainId, currency, isTrustedTokenList, isReady, count],
    false, // don't clear data between polls
  )

  // Reset the counter when safe address/chainId changes
  useEffect(() => {
    resetPolling()
  }, [resetPolling, safeAddress, chainId])

  // Counterfactual balances
  const [cfData, cfError, cfLoading] = useCounterfactualBalances(safe)

  if (isCounterfactual) {
    data = cfData as unknown as Balances
    loading = cfLoading
    error = cfError
  }

  return useMemo(() => [data, error, loading], [data, error, loading]) as AsyncResult<Balances>
}

export default useLoadBalances
