import { KnownContracts, getModuleInstance } from '@gnosis.pm/zodiac'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import useWallet from '@/hooks/wallets/useWallet'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { useGnosisPayDelayModule } from './useGnosisPayDelayModule'

// Dev-only escape hatch for previewing the Gnosis Pay owner flow without
// actually controlling the wallet that's enabled on the Delay proxy.
// In the browser console: localStorage.setItem('gnosisPayForceOwner', '1') and reload.
// To turn off: localStorage.removeItem('gnosisPayForceOwner'). Hard-gated on
// NODE_ENV so it cannot be flipped on in production builds.
const isDevForceOwner = (): boolean => {
  if (process.env.NODE_ENV === 'production') return false
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage?.getItem('gnosisPayForceOwner') === '1'
  } catch {
    return false
  }
}

export const useIsGnosisPayOwner = (): AsyncResult<boolean> => {
  const wallet = useWallet()
  const web3ReadOnly = useWeb3ReadOnly()
  const [gnosisPayDelayModifier] = useGnosisPayDelayModule()

  return useAsync(async () => {
    if (gnosisPayDelayModifier && isDevForceOwner()) return true
    if (!wallet?.address || !gnosisPayDelayModifier || !web3ReadOnly) {
      return false
    }
    const delayContract = getModuleInstance(KnownContracts.DELAY, gnosisPayDelayModifier.value, web3ReadOnly)
    return delayContract.isModuleEnabled(wallet.address)
  }, [gnosisPayDelayModifier, wallet?.address, web3ReadOnly])
}
