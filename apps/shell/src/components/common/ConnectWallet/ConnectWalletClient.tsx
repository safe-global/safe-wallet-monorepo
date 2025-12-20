import type { ReactElement } from 'react'
import { useWallet } from '@/hooks/useWallet'
import AccountCenter from './AccountCenter'
import ConnectionCenter from './ConnectionCenter'

/**
 * Client-side only component for wallet connection
 * Separated from index.tsx to avoid SSR issues with useWallet hook
 */
const ConnectWalletClient = (): ReactElement => {
  const { wallet } = useWallet()

  return wallet ? <AccountCenter wallet={wallet} /> : <ConnectionCenter />
}

export default ConnectWalletClient
