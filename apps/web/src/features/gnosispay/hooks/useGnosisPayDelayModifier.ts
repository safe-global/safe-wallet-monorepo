import useChainId from '@/hooks/useChainId'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useWallet from '@/hooks/wallets/useWallet'
// This hook is part of the lazy Gnosis Pay feature chunk (loaded via
// useLoadFeature on a Gnosis Pay safe), so importing recovery-sender
// directly is safe — it doesn't enter the global eager bundle. The recovery
// services barrel intentionally does not re-export `getDelayModifierContract`
// to keep `@gnosis.pm/zodiac` out of the eager graph.
// eslint-disable-next-line no-restricted-imports
import { getDelayModifierContract } from '@/features/recovery/services/recovery-sender'
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
