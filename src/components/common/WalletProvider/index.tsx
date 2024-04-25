import { createContext, type ReactElement, type ReactNode, useEffect, useState } from 'react'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { useWallets, usePrivy } from '@privy-io/react-auth'

export const WalletContext = createContext<ConnectedWallet | null>(null)

const WalletProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const { wallets, ready } = useWallets()
  const { authenticated } = usePrivy()
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null)

  useEffect(() => {
    if (!authenticated) return setWallet(null)
    if (!wallets || !ready) return
    ;(async () => {
      setWallet({
        ...wallets[0],
        label: 'Privy',
        provider: await wallets[0].getEthereumProvider(),
        chainId: wallets[0].chainId.split(':')[1],
      })
    })()
  }, [wallets, ready, authenticated])

  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
}

export default WalletProvider
