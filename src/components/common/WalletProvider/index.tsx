import { createContext, type ReactElement, type ReactNode, useEffect, useState } from 'react'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { useWallets, usePrivy } from '@privy-io/react-auth'
import { ethers, type Eip1193Provider } from 'ethers'

export const WalletContext = createContext<ConnectedWallet | null>(null)

const WalletProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const { wallets, ready } = useWallets()
  const { authenticated } = usePrivy()
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null)

  const getWalletBalance = async (provider: Eip1193Provider, address: string) => {
    const balance = await provider.request({ method: 'eth_getBalance', params: [address, 'latest'] })
    return ethers.formatEther(balance)
  }

  useEffect(() => {
    if (!authenticated) return setWallet(null)
    if (!wallets[0] || !ready) return
      ; (async () => {
        setWallet({
          ...wallets[0],
          balance: (await getWalletBalance(await wallets[0].getEthereumProvider(), wallets[0].address)).toString(),
          label: 'Privy',
          provider: await wallets[0].getEthereumProvider(),
          chainId: wallets[0].chainId.split(':')[1],
        })
      })()
  }, [wallets, ready, authenticated])

  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
}

export default WalletProvider
