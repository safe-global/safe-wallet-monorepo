import { useEffect, useState, useMemo, type ReactNode } from 'react'
import type { Eip1193Provider } from 'ethers'
import type { WalletState } from '@safe-global/shell-protocol'
import { getShellCommunicator } from '@/services/shell-communicator'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import type { SignerWallet, WalletContextType } from '@/components/common/WalletProvider'
import { WalletContext } from '@/components/common/WalletProvider'

/**
 * Proxy EIP-1193 provider that forwards all requests to the shell via postMessage
 */
class ProxyProvider implements Eip1193Provider {
  constructor(private communicator: ReturnType<typeof getShellCommunicator>) {}

  async request(args: { method: string; params?: unknown[] }): Promise<unknown> {
    return this.communicator.sendRpcRequest(args.method, args.params || [])
  }
}

/**
 * Wallet provider for iframe mode
 * Receives wallet state from the parent shell app via postMessage
 */
const IframeWalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletState, setWalletState] = useState<WalletState | null>(null)
  const communicator = useMemo(() => getShellCommunicator(), [])
  const proxyProvider = useMemo(() => new ProxyProvider(communicator), [communicator])

  // Initialize communicator and request initial wallet state
  useEffect(() => {
    communicator.initialize(process.env.NEXT_PUBLIC_COMMIT_HASH || 'dev')

    // Request initial wallet state
    communicator.requestWalletState().then(setWalletState).catch(console.error)

    // Listen for wallet state changes from shell
    const unsubscribe = communicator.on('WALLET_STATE_CHANGED', (message) => {
      if (message.payload.type === 'WALLET_STATE_CHANGED') {
        setWalletState(message.payload.payload)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [communicator])

  // Convert WalletState to ConnectedWallet format
  const connectedWallet: ConnectedWallet | null = useMemo(() => {
    if (!walletState || !walletState.isConnected || !walletState.address || !walletState.chainId) {
      return null
    }

    return {
      label: walletState.label || 'Shell Wallet',
      address: walletState.address,
      chainId: walletState.chainId,
      provider: proxyProvider,
      ens: walletState.ens,
      balance: walletState.balance,
    }
  }, [walletState, proxyProvider])

  // Signer is the same as connected wallet in iframe mode
  const signer: SignerWallet | null = useMemo(() => {
    if (!connectedWallet) return null

    return {
      provider: connectedWallet.provider,
      address: connectedWallet.address,
      chainId: connectedWallet.chainId,
    }
  }, [connectedWallet])

  const contextValue: WalletContextType = {
    connectedWallet,
    signer,
    // In iframe mode, signer address is controlled by shell
    setSignerAddress: () => {
      console.warn('Cannot set signer address in iframe mode - controlled by shell')
    },
  }

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>
}

export default IframeWalletProvider
