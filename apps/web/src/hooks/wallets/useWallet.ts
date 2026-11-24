import { useContext } from 'react'
import { type ConnectedWallet } from './useOnboard'
import { WalletContext } from '@/components/common/WalletProvider/WalletContext'

const useWallet = (): ConnectedWallet | null => {
  return useContext(WalletContext)?.connectedWallet ?? null
}

export const useSigner = () => {
  return useContext(WalletContext)?.signer ?? null
}

export const useWalletContext = () => {
  return useContext(WalletContext)
}

export default useWallet
