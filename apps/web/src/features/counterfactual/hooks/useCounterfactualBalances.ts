import { getCounterfactualBalance } from '../services/getCounterfactualBalance'
import { useWeb3 } from '@/hooks/wallets/web3ReadOnly'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useCurrentChain } from '@/hooks/useChains'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { hasFeature, FEATURES } from '@safe-global/utils/utils/chains'

export function useCounterfactualBalances(safe: ExtendedSafeInfo) {
  const web3 = useWeb3()
  const chain = useCurrentChain()
  const safeAddress = safe.address.value
  const isCounterfactual = !safe.deployed
  const hideNativeToken = chain ? hasFeature(chain, FEATURES.HIDE_NATIVE_TOKEN) : false

  return useAsync<Balances | undefined>(() => {
    if (!chain || !isCounterfactual || !safeAddress) return

    if (hideNativeToken) {
      return Promise.resolve(<Balances>{ fiatTotal: '0', items: [] })
    }

    return getCounterfactualBalance(safeAddress, web3, chain)
  }, [chain, safeAddress, web3, isCounterfactual, hideNativeToken])
}
