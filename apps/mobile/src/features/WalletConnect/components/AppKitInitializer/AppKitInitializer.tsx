import React, { useRef } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChains, selectActiveChain } from '@/src/store/chains'
import { cgwChainsToReownNetworks } from '@/src/features/WalletConnect/utils/chains'
import { AppKitInstance, createAppKitInstance } from '@/src/features/WalletConnect/appKit'
import { WalletConnectProvider } from '@/src/features/WalletConnect/context/WalletConnectContext'
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
      const networks = reownNetworks as [(typeof reownNetworks)[0], ...typeof reownNetworks]
      const defaultNetwork = activeChain
        ? reownNetworks.find((n) => n.id === parseInt(activeChain.chainId, 10))
        : networks[0]

      Logger.info(`AppKit initialized with ${networks.length} networks. Default: ${defaultNetwork?.id}.`)
      instanceRef.current = createAppKitInstance(networks, defaultNetwork)
    }
  }

  return <WalletConnectProvider instance={instanceRef.current}>{children}</WalletConnectProvider>
}
