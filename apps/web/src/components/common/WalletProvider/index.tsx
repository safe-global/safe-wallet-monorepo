import { createContext, type ReactElement, type ReactNode, useEffect, useState, useMemo } from 'react'
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
  // The signer is the in-app nested signer (a parent Safe picked from the signer dropdown, wrapped
  // by getNestedWallet). It executes an on-chain signature/execution immediately at threshold 1.
  isSafe?: boolean
  // The connected wallet is itself a Safe (e.g. connected via WalletConnect) acting as the signer.
  // Such a Safe always returns a safeTxHash from eth_sendTransaction (never executes synchronously).
  isConnectedSafe?: boolean
  // Threshold of the signer Safe when `isSafe`/`isConnectedSafe` is true.
  threshold?: number
}

export type WalletContextType = {
  connectedWallet: ConnectedWallet | null
  signer: SignerWallet | null
  setSignerAddress: (address: string | undefined) => void
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

  const [signerAddress, setSignerAddress] = useState<string>()

  const { currentData: nestedSafeInfo } = useSafesGetSafeV1Query(
    { chainId: currentChain?.chainId || '', safeAddress: signerAddress || '' },
    {
      skip: !signerAddress || !currentChain || sameAddress(signerAddress, wallet?.address || ''),
    },
  )

  // A Safe connected directly (e.g. via WalletConnect) acts as its own signer. Resolve its Safe
  // info so the tx flow can treat it as a Safe signer (on-chain approveHash/execTransaction that
  // only queues) rather than an EOA. Returns undefined (404) for EOAs and non-Safe smart accounts.
  // Gated on matching chains so a same-address Safe on a different chain can't be misdetected.
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
      return getNestedWallet(wallet, nestedSafeInfo, web3ReadOnly, router)
    }
    if (wallet && connectedSafeInfo) {
      return { ...wallet, isConnectedSafe: true as const, threshold: connectedSafeInfo.threshold }
    }
    return wallet
  }, [wallet, nestedSafeInfo, connectedSafeInfo, web3ReadOnly, router])

  return (
    <WalletContext.Provider
      value={{
        connectedWallet: wallet,
        signer,
        setSignerAddress,
        isReady: !!walletReady,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export default WalletProvider
