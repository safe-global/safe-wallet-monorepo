import React, { useRef } from 'react'
import type { Network } from '@reown/appkit-common-react-native'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChains, selectActiveChain } from '@/src/store/chains'
import { cgwChainsToReownNetworks } from '@/src/features/WalletConnect/utils/chains'
import { AppKitInstance, createAppKitInstance, FALLBACK_NETWORKS } from '@/src/features/WalletConnect/appKit'
import { WalletConnectProvider } from '@/src/features/WalletConnect/context/WalletConnectContext'
import Logger from '@/src/utils/logger'

/**
 * Initializes AppKit with dynamic networks from the hydrated Redux store,
 * then renders WalletConnectProvider with the created instance.
 *
 * Must be rendered inside PersistGate so that persisted chain data is available.
 * On first launch (no persisted chains), falls back to [mainnet].
 */
export function AppKitInitializer({ children }: { children: React.ReactNode }) {
  const chains = useAppSelector(selectAllChains)
  const activeChain = useAppSelector(selectActiveChain)

  const instanceRef = useRef<AppKitInstance | null>(null)

  if (!instanceRef.current) {
    const reownNetworks = cgwChainsToReownNetworks(chains)
    const networks: [Network, ...Network[]] =
      reownNetworks.length > 0 ? (reownNetworks as [Network, ...Network[]]) : FALLBACK_NETWORKS
    const defaultNetwork = activeChain
      ? reownNetworks.find((n) => n.id === parseInt(activeChain.chainId, 10))
      : networks[0]

    Logger.info(`AppKit initialized with ${networks.length} networks. Default: ${defaultNetwork?.id}.`)
    instanceRef.current = createAppKitInstance(networks, defaultNetwork)
  }

  return <WalletConnectProvider instance={instanceRef.current}>{children}</WalletConnectProvider>
}
