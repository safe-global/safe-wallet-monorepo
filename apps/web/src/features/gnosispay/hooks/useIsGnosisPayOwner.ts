import { KnownContracts, getModuleInstance } from '@gnosis.pm/zodiac'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import useWallet from '@/hooks/wallets/useWallet'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { useGnosisPayDelayModule } from './useGnosisPayDelayModule'

export const useIsGnosisPayOwner = (): AsyncResult<boolean> => {
  const wallet = useWallet()
  const web3ReadOnly = useWeb3ReadOnly()
  const [gnosisPayDelayModifier] = useGnosisPayDelayModule()

  return useAsync(async () => {
    if (!wallet?.address || !gnosisPayDelayModifier || !web3ReadOnly) {
      return false
    }
    const delayContract = getModuleInstance(KnownContracts.DELAY, gnosisPayDelayModifier.value, web3ReadOnly)
    return delayContract.isModuleEnabled(wallet.address)
  }, [gnosisPayDelayModifier, wallet?.address, web3ReadOnly])
}
