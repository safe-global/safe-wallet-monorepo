import React from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { WalletKitProvider } from './WalletKitProvider'

/**
 * Gates the WalletConnect-for-dApps feature behind the NATIVE_WALLETCONNECT chain-config
 * flag. When the active chain does not advertise the feature — or no Safe is active yet,
 * so useHasFeature is undefined — WalletKitProvider is never mounted: no listeners, no
 * request sheet, no singleton init. Children always render either way.
 */
export const WalletKitGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isEnabled = useHasFeature(FEATURES.NATIVE_WALLETCONNECT) ?? false

  if (!isEnabled) {
    return <>{children}</>
  }

  return <WalletKitProvider>{children}</WalletKitProvider>
}
