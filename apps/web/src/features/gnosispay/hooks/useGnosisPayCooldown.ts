import { KnownContracts, getModuleInstance } from '@gnosis.pm/zodiac'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { useGnosisPayDelayModule } from '../public/hooks/useGnosisPayDelayModule'

export const useGnosisPayCooldown = () => {
  const provider = useWeb3ReadOnly()
  const [module] = useGnosisPayDelayModule()
  return useAsync(async () => {
    if (!module || !provider) return undefined
    return Number(await getModuleInstance(KnownContracts.DELAY, module.value, provider).txCooldown())
  }, [module, provider])
}
