import { type SafeBalanceResponse } from '@safe-global/safe-gateway-typescript-sdk'
import { getCounterfactualBalance } from '@/features/counterfactual/utils'
import { useWeb3 } from '@/hooks/wallets/web3'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import useAsync from '@/hooks/useAsync'
import { useCurrentChain } from '@/hooks/useChains'

export function useCounterfactualBalances(safe: ExtendedSafeInfo) {
  const web3 = useWeb3()
  const chain = useCurrentChain()
  const safeAddress = safe.address.value
  const isCounterfactual = !safe.deployed

  return useAsync<SafeBalanceResponse | undefined>(() => {
    if (!chain || !isCounterfactual || !safeAddress) return
    return getCounterfactualBalance(safeAddress, web3, chain)
  }, [chain, safeAddress, web3, isCounterfactual])
}
