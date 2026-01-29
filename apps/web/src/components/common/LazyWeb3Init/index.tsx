/**
 * Lazy-loaded component that initializes Web3 related hooks.
 * This is loaded via next/dynamic to keep viem and protocol-kit out of the main _app chunk.
 */
import { useInitOnboard } from '@/hooks/wallets/useOnboard'
import { useInitSafeCoreSDK } from '@/hooks/coreSDK/useInitSafeCoreSDK'

const LazyWeb3Init = (): null => {
  useInitOnboard()
  useInitSafeCoreSDK()
  return null
}

export default LazyWeb3Init
