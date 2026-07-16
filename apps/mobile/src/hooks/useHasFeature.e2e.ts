/**
 * E2E override for `useHasFeature` (selected by Metro via RN_SRC_EXT=e2e.ts).
 *
 * Behaves identically to the production hook EXCEPT it can force
 * NATIVE_WALLETCONNECT on when a WalletConnect dApp test has armed the flag via
 * `walletKitE2eState`. This decouples the dApp surface (header QR button,
 * WalletKitController) from the remote chains config so flows are
 * self-contained. All other features — and all tests that never set the flag —
 * resolve exactly as in production.
 */
import { useSyncExternalStore } from 'react'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'
import { walletKitE2eState } from '@/src/features/WalletConnect/Wallet/walletKitE2eState'

export const useHasFeature = (feature: FEATURES): boolean | undefined => {
  const chain = useAppSelector(selectActiveChain)
  // Subscribe so arming the flag re-renders consumers (the QR button /
  // WalletKitController), instead of relying on an incidental Redux dispatch.
  const forceNativeWalletConnect = useSyncExternalStore(
    walletKitE2eState.subscribe,
    () => walletKitE2eState.get().forceNativeWalletConnect,
  )
  if (feature === FEATURES.NATIVE_WALLETCONNECT && forceNativeWalletConnect) {
    return true
  }
  return chain ? hasFeature(chain, feature) : undefined
}
