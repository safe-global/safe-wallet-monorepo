import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import useWallet from '@/hooks/wallets/useWallet'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useCurrentChain } from '@/hooks/useChains'
import { estimateSafeCreationGas } from '@/components/new-safe/create/logic'
import { type SafeVersion } from '@safe-global/types-kit'
import { type UndeployedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'

export const useEstimateSafeCreationGas = (
  undeployedSafe: UndeployedSafeProps | undefined,
  safeVersion?: SafeVersion,
): {
  gasLimit?: bigint
  gasLimitError?: Error
  gasLimitLoading: boolean
} => {
  const web3ReadOnly = useWeb3ReadOnly()
  const chain = useCurrentChain()
  const wallet = useWallet()

  const [gasLimit, gasLimitError, gasLimitLoading] = useAsync<bigint>(() => {
    if (!wallet?.address || !chain || !web3ReadOnly || !undeployedSafe) return

    return estimateSafeCreationGas(chain, web3ReadOnly, wallet.address, undeployedSafe, safeVersion)
  }, [wallet?.address, chain, web3ReadOnly, undeployedSafe, safeVersion])

  return { gasLimit, gasLimitError, gasLimitLoading }
}
