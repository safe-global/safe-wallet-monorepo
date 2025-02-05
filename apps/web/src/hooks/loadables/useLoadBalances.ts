import { getCounterfactualBalance } from '@/features/counterfactual/utils'
import { useWeb3 } from '@/hooks/wallets/web3'
import { useMemo } from 'react'
import { type SafeBalanceResponse } from '@safe-global/safe-gateway-typescript-sdk'
import { type Balances, useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useAppSelector } from '@/store'
import useAsync, { type AsyncResult } from '../useAsync'
import { selectCurrency, selectSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { useCurrentChain } from '../useChains'
import { FEATURES, hasFeature } from '@/utils/chains'
import useSafeInfo from '../useSafeInfo'
import type { ExtendedSafeInfo } from '@/store/safeInfoSlice'
import { POLLING_INTERVAL } from '@/config/constants'

const DEFAULT_BALANCES = { items: [], fiatTotal: '' }

export const useTokenListSetting = (): boolean | undefined => {
  const chain = useCurrentChain()
  const settings = useAppSelector(selectSettings)

  const isTrustedTokenList = useMemo(() => {
    if (settings.tokenList === TOKEN_LISTS.ALL) return false
    return chain ? hasFeature(chain, FEATURES.DEFAULT_TOKENLIST) : undefined
  }, [chain, settings.tokenList])

  return isTrustedTokenList
}

const useCounterfactualBalances = (safe: ExtendedSafeInfo) => {
  const web3 = useWeb3()
  const chain = useCurrentChain()
  const safeAddress = safe.address.value
  const isCounterfactual = !safe.deployed

  const [data] = useAsync<SafeBalanceResponse | undefined>(() => {
    if (!chain || !web3 || !isCounterfactual) return
    return getCounterfactualBalance(safeAddress, web3, chain)
  }, [chain, safeAddress, web3, isCounterfactual])

  return data as unknown as Balances
}

export const useRtkBalances = () => {
  const currency = useAppSelector(selectCurrency)
  const isTrustedTokenList = useTokenListSetting()
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const isReady = safeLoaded && safe.deployed && isTrustedTokenList !== undefined

  const { data, isLoading, error } = useBalancesGetBalancesV1Query(
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
  const cfData = useCounterfactualBalances(safe)

  return useMemo(
    () => ({
      balances: data || cfData || DEFAULT_BALANCES,
      error: error ? new Error('message' in error ? error.message : 'Failed to load balances') : undefined,
      loading: isLoading,
    }),
    [data, cfData, error, isLoading],
  )
}

export const useLoadBalances = (): AsyncResult<Balances> => {
  const { balances, error, loading } = useRtkBalances()

  return [balances, error, loading]
}

export default useLoadBalances
