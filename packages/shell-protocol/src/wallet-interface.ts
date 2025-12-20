import type { WalletState } from './messages'

/**
 * Shell wallet interface exposed via window.wallet
 * Provides synchronous state access and async method calls
 */
export interface ShellWallet {
  // Synchronous state accessors
  readonly address: string | null
  readonly chainId: string | null
  readonly isConnected: boolean
  readonly label: string | null
  readonly ens?: string
  readonly balance?: string

  // Async methods (resolved via postMessage)
  connect(): Promise<{ address: string; chainId: string }>
  disconnect(): Promise<void>
  switchChain(chainId: string): Promise<void>

  // Event subscriptions
  on(
    event: 'connect' | 'disconnect' | 'chainChanged' | 'accountsChanged',
    callback: (data: unknown) => void,
  ): () => void

  // Get provider for RPC requests
  getProvider(): unknown | null
}

/**
 * Window type augmentation to include wallet
 */
declare global {
  interface Window {
    wallet?: ShellWallet
  }
}

export {}
