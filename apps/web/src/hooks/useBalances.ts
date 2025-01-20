import { getCounterfactualBalance } from '@/features/counterfactual/utils'
import { useWeb3 } from '@/hooks/wallets/web3'
import { useMemo } from 'react'
import { type SafeBalanceResponse } from '@safe-global/safe-gateway-typescript-sdk'
import { useAppSelector } from '@/store'
import useAsync from '@/hooks/useAsync'
import { selectCurrency, selectSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { useCurrentChain } from '@/hooks/useChains'
import { FEATURES, hasFeature } from '@/utils/chains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { ExtendedSafeInfo } from '@/store/safeInfoSlice'

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

  return data
}

const useBalances = () => {
  const currency = useAppSelector(selectCurrency)
  const isTrustedTokenList = useTokenListSetting()
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const isReady = safeLoaded && isTrustedTokenList !== undefined

  const { data, isLoading, error } = useBalancesGetBalancesV1Query(
    {
      chainId: safe.chainId,
      safeAddress,
      fiatCode: currency,
      trusted: isTrustedTokenList,
    },
    {
      skip: !isReady,
    },
  )

  // Counterfactual balances
  const cfData = useCounterfactualBalances(safe)

  return useMemo(
    () => ({
      balances: data || cfData || { items: [], fiatTotal: '' },
      error,
      loading: isLoading,
    }),
    [data, error, isLoading],
  )
}

export default useBalances
