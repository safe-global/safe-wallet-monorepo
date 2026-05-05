import useChainId from '@/hooks/useChainId'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useWallet from '@/hooks/wallets/useWallet'
import { getDelayModifierContract } from '@/features/recovery/services'
import { useGnosisPayDelayModule } from './useGnosisPayDelayModule'

export const useGnosisPayDelayModifier = () => {
  const chainId = useChainId()
  const wallet = useWallet()
  const [gnosisPayDelayModifier] = useGnosisPayDelayModule()

  return useAsync(
    () =>
      gnosisPayDelayModifier && wallet
        ? getDelayModifierContract({
            provider: wallet.provider,
            chainId,
            delayModifierAddress: gnosisPayDelayModifier.value,
            signerAddress: wallet.address,
          })
        : undefined,
    [chainId, gnosisPayDelayModifier, wallet],
  )
}
