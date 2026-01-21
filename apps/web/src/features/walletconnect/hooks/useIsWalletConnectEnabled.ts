import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIsWalletConnectEnabled(): boolean | undefined {
  return useHasFeature(FEATURES.NATIVE_WALLETCONNECT)
}
