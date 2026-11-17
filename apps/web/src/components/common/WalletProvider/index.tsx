import {
  createContext,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import useOnboard, { type ConnectedWallet, getConnectedWallet, useIsWalletReady } from '@/hooks/wallets/useOnboard'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { useCurrentChain } from '@/hooks/useChains'
import { useRouter } from 'next/router'
import { type Eip1193Provider } from 'ethers'
import { getNestedWallet } from '@/utils/nested-safe-wallet'
import { sameAddress } from '@safe-global/utils/utils/addresses'

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
  getParentSafeNonce: () => number | undefined
  setParentSafeNonce: (nonce: number) => void
  clearParentSafeNonce: () => void
  isReady: boolean
}

export const WalletContext = createContext<WalletContextType | null>(null)

const WalletProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const onboard = useOnboard()
  const walletReady = useIsWalletReady()
  const currentChain = useCurrentChain()
  const web3ReadOnly = useWeb3ReadOnly()
  const router = useRouter()
  const onboardWallets = onboard?.state.get().wallets || []
  const [wallet, setWallet] = useState<ConnectedWallet | null>(getConnectedWallet(onboardWallets))

  const [signerAddress, setSelectedSignerAddress] = useState<string>()
  // Refs, so a nonce edit doesn't rebuild the signer object
  const selectedSignerAddress = useRef<string | undefined>(undefined)
  const parentSafeNonce = useRef<number | undefined>(undefined)

  // The parent Safe nonce lives as long as the signer selection, not as long as a tx flow step
  const setSignerAddress = useCallback((address: string | undefined) => {
    if (!sameAddress(address, selectedSignerAddress.current)) {
      parentSafeNonce.current = undefined
    }
    selectedSignerAddress.current = address
    setSelectedSignerAddress(address)
  }, [])
  const getParentSafeNonce = useCallback(() => parentSafeNonce.current, [])
  const setParentSafeNonce = useCallback((nonce: number) => {
    parentSafeNonce.current = nonce
  }, [])
  const clearParentSafeNonce = useCallback(() => {
    parentSafeNonce.current = undefined
  }, [])

  const { currentData: nestedSafeInfo } = useSafesGetSafeV1Query(
    { chainId: currentChain?.chainId || '', safeAddress: signerAddress || '' },
    {
      skip: !signerAddress || !currentChain || sameAddress(signerAddress, wallet?.address || ''),
    },
  )

  // Chain-gated so a same-address Safe on another chain isn't misdetected
  const { currentData: connectedSafeInfo } = useSafesGetSafeV1Query(
    { chainId: currentChain?.chainId || '', safeAddress: wallet?.address || '' },
    {
      skip: !wallet?.address || !currentChain || wallet.chainId !== currentChain.chainId,
    },
  )

  useEffect(() => {
    if (!onboard) return

    const walletSubscription = onboard.state.select('wallets').subscribe((wallets) => {
      const newWallet = getConnectedWallet(wallets)

      setWallet(newWallet)
    })

    return () => {
      walletSubscription.unsubscribe()
    }
  }, [onboard])

  const signer = useMemo(() => {
    if (wallet && nestedSafeInfo && web3ReadOnly) {
      return getNestedWallet(wallet, nestedSafeInfo, web3ReadOnly, router, {
        get: getParentSafeNonce,
        clear: clearParentSafeNonce,
      })
    }
    if (wallet && connectedSafeInfo) {
      return { ...wallet, isConnectedSafe: true as const, threshold: connectedSafeInfo.threshold }
    }
    return wallet
  }, [wallet, nestedSafeInfo, connectedSafeInfo, web3ReadOnly, router, getParentSafeNonce, clearParentSafeNonce])

  return (
    <WalletContext.Provider
      value={{
        connectedWallet: wallet,
        signer,
        setSignerAddress,
        getParentSafeNonce,
        setParentSafeNonce,
        clearParentSafeNonce,
        isReady: !!walletReady,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export default WalletProvider
