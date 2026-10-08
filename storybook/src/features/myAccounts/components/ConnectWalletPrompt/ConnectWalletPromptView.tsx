import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { WalletIcon } from 'lucide-react'

export type ConnectWalletPromptViewProps = {
  onConnect: () => void
}

export const ConnectWalletPromptView = ({ onConnect }: ConnectWalletPromptViewProps) => {
  return (
    <Alert data-testid="connect-wallet-prompt" className="mb-4">
      <WalletIcon />
      <AlertTitle>Connect your wallet</AlertTitle>
      <AlertDescription className="mb-4">Connect your wallet to view and manage your Safe accounts.</AlertDescription>
      <div>
        <Button size="sm" onClick={onConnect} data-testid="connect-wallet-button">
          <WalletIcon />
          Connect wallet
        </Button>
      </div>
    </Alert>
  )
}
