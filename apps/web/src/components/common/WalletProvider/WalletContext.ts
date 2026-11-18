import { createContext } from 'react'
import type { Eip1193Provider } from 'ethers'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'

export type SignerWallet = {
  provider: Eip1193Provider | null
  address: string
  chainId: string
  // In-app nested signer: only proposes in the parent, never executes
  isSafe?: boolean
  // The connected wallet is itself a Safe, e.g. via WalletConnect
  isConnectedSafe?: boolean
  threshold?: number
}

export type WalletContextType = {
  connectedWallet: ConnectedWallet | null
  signer: SignerWallet | null
  setSignerAddress: (address: string | undefined) => void
  // Nonce of the tx the in-app parent Safe signer creates; without one it uses the recommended nonce
  setParentSafeNonce: (nonce: number) => void
  clearParentSafeNonce: () => void
  isReady: boolean
}

export const WalletContext = createContext<WalletContextType | null>(null)
