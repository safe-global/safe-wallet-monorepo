import type { ReactElement } from 'react'
import dynamic from 'next/dynamic'

// Import ConnectWallet as a client-side only component to avoid SSR issues
const ConnectWalletClient = dynamic(() => import('./ConnectWalletClient'), {
  ssr: false,
  loading: () => <div style={{ width: 180, height: 40 }} />, // Placeholder during SSR
})

const ConnectWallet = (): ReactElement => {
  return <ConnectWalletClient />
}

export default ConnectWallet
