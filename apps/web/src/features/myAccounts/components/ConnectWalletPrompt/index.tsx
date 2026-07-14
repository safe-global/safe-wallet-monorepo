import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { WalletIcon } from 'lucide-react'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'

/**
 * Prompt displayed when user is not connected to a wallet
 * Guides them to connect to see their Safes
 */
const ConnectWalletPrompt = () => {
  const connectWallet = useConnectWallet()

  return (
    <Alert data-testid="connect-wallet-prompt" className="mb-4">
      <WalletIcon />
      <AlertTitle>Connect your wallet</AlertTitle>
      <AlertDescription className="mb-4">Connect your wallet to view and manage your Safe accounts.</AlertDescription>
      <div>
        <Button size="sm" onClick={connectWallet} data-testid="connect-wallet-button">
          <WalletIcon />
          Connect wallet
        </Button>
      </div>
    </Alert>
  )
}

export default ConnectWalletPrompt
