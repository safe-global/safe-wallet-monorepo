import { createContext, type ReactElement, type ReactNode, useEffect, useState } from 'react'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { BrowserProvider, ethers } from 'ethers'
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { EIP1193Provider } from 'viem'

export const WalletContext = createContext<ConnectedWallet | null>(null)

const WalletProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const { address, isConnected, caipAddress } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null)

  const getWalletBalance = async (provider: BrowserProvider, address: string) => {
    const balance = await provider.getBalance(address)
    return ethers.formatEther(balance)
  }

  useEffect(() => {
    if (!isConnected) return setWallet(null)
    const ethersProvider = new BrowserProvider(walletProvider as EIP1193Provider)
    ;(async () => {
      setWallet({
        address: address!,
        balance: await getWalletBalance(ethersProvider, address!),
        label: 'Reown',
        provider: walletProvider as EIP1193Provider,
        chainId: caipAddress!.split(':')[1],
      })
    })()
  }, [isConnected])

  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
}

export default WalletProvider
