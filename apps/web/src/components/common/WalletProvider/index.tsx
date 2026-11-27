import { type ReactElement, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useOnboard, { type ConnectedWallet, getConnectedWallet, useIsWalletReady } from '@/hooks/wallets/useOnboard'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { useCurrentChain } from '@/hooks/useChains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { WalletContext } from './WalletContext'
import { useSignerWallet } from './useSignerWallet'

const WalletProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const onboard = useOnboard()
  const walletReady = useIsWalletReady()
  const currentChain = useCurrentChain()
  const web3ReadOnly = useWeb3ReadOnly()
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

  const chosenNonce = useMemo(
    () => ({ get: getParentSafeNonce, clear: clearParentSafeNonce }),
    [getParentSafeNonce, clearParentSafeNonce],
  )
  const signer = useSignerWallet({
    wallet,
    signerAddress,
    chainId: currentChain?.chainId,
    web3ReadOnly,
    chosenNonce,
  })

  return (
    <WalletContext.Provider
      value={{
        connectedWallet: wallet,
        signer,
        signerAddress,
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
