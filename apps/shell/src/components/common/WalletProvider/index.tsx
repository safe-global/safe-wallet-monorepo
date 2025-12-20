import { createContext, type ReactElement, type ReactNode, useEffect, useState } from 'react'
import useOnboard, { type ConnectedWallet, getConnectedWallet } from '@/hooks/wallets/useOnboard'

export type WalletContextType = {
  wallet: ConnectedWallet | null
}

export const WalletContext = createContext<WalletContextType | null>(null)

const WalletProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const onboard = useOnboard()
  const onboardWallets = onboard?.state.get().wallets || []
  const [wallet, setWallet] = useState<ConnectedWallet | null>(getConnectedWallet(onboardWallets))

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

  return (
    <WalletContext.Provider
      value={{
        wallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export default WalletProvider
