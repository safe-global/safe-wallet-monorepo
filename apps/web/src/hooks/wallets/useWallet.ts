import { useContext } from 'react'
import { type ConnectedWallet } from './useOnboard'
import { WalletContext } from '@/components/common/WalletProvider'

const useWallet = (): ConnectedWallet | null => {
  return useContext(WalletContext)?.connectedWallet ?? null
}

export const useSigner = () => {
  return useContext(WalletContext)?.signer ?? null
}

export const useWalletContext = () => {
  return useContext(WalletContext)
}

/** Returns true once Onboard has finished initializing and attempting to reconnect the last wallet */
export const useIsWalletReady = (): boolean => {
  return useContext(WalletContext)?.isWalletReady ?? false
}

export default useWallet
