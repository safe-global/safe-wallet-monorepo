import { useContext } from 'react'
import { WalletContext, type WalletContextType } from '@/components/common/WalletProvider'

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
