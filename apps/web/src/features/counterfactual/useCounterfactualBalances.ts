import { getCounterfactualBalance } from '@/features/counterfactual/utils'
import useAsync from '@/hooks/useAsync'
import { useCurrentChain } from '@/hooks/useChains'
import { useWeb3 } from '@/hooks/wallets/web3'
import type { ExtendedSafeInfo } from '@/store/safeInfoSlice'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

export function useCounterfactualBalances(safe: ExtendedSafeInfo) {
  const web3 = useWeb3()
  const chain = useCurrentChain()
  const safeAddress = safe.address.value
  const isCounterfactual = !safe.deployed

  return useAsync<Balances | undefined>(() => {
    if (!chain || !isCounterfactual || !safeAddress) return
    return getCounterfactualBalance(safeAddress, web3, chain)
  }, [chain, safeAddress, web3, isCounterfactual])
}
