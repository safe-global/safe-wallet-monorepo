import React from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { WalletKitProvider } from './WalletKitProvider'

/**
 * Gates the WalletConnect-for-dApps feature behind the NATIVE_WALLETCONNECT chain-config
 * flag. When the active chain does not advertise the feature — or no Safe is active yet,
 * so useHasFeature is undefined — WalletKitProvider is never mounted: no listeners, no
 * request sheet, no singleton init.
 *
 * `children` (the navigation tree) is always rendered in the same position, and the
 * provider is mounted as a sibling rather than a wrapper. This is deliberate: flipping
 * `isEnabled` (e.g. when the first Safe is imported and an active chain appears) must NOT
 * change the element type wrapping `children`, or React would unmount and remount the
 * whole navigation stack — discarding in-flight navigation and bouncing the user back to
 * the landing screen.
 */
export const WalletKitGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isEnabled = useHasFeature(FEATURES.NATIVE_WALLETCONNECT) ?? false

  return (
    <>
      {children}
      {isEnabled ? <WalletKitProvider /> : null}
    </>
  )
}
