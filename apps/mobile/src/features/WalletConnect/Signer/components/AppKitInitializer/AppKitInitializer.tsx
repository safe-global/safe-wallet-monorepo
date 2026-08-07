import React, { useRef } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChains, selectActiveChain } from '@/src/store/chains'
import { cgwChainsToReownNetworks } from '@/src/features/WalletConnect/Signer/utils/chains'
import { AppKitInstance, createAppKitInstance } from '@/src/features/WalletConnect/Signer/appKit'
import { WalletConnectProvider } from '@/src/features/WalletConnect/Signer/context/WalletConnectContext'
import Logger from '@/src/utils/logger'

/**
 * Initializes AppKit with dynamic networks from the hydrated Redux store,
 * then renders WalletConnectProvider with the created instance.
 *
 * Must be rendered inside PersistGate so that persisted chain data is available.
 * Defers initialization until CGW chain configs are loaded — WalletConnect
 * functionality is unavailable until then.
 */
export function AppKitInitializer({ children }: { children: React.ReactNode }) {
  const chains = useAppSelector(selectAllChains)
  const activeChain = useAppSelector(selectActiveChain)

  const instanceRef = useRef<AppKitInstance | null>(null)

  if (!instanceRef.current) {
    const reownNetworks = cgwChainsToReownNetworks(chains)

    if (reownNetworks.length > 0) {
      const [firstNetwork, ...restNetworks] = reownNetworks
      const defaultNetwork = activeChain
        ? reownNetworks.find((n) => n.id === parseInt(activeChain.chainId, 10))
        : firstNetwork

      Logger.info(`AppKit initialized with ${reownNetworks.length} networks. Default: ${defaultNetwork?.id}.`)
      instanceRef.current = createAppKitInstance([firstNetwork, ...restNetworks], defaultNetwork)
    }
  }

  return <WalletConnectProvider instance={instanceRef.current}>{children}</WalletConnectProvider>
}
