import { Wallet } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'

/**
 * Inline hint shown when adding/selecting Safe accounts without a connected wallet.
 * Locally stored Safes are still listed; this nudges the user to connect so the
 * Safes their wallet owns (or can sign for) are discovered too.
 *
 * `onConnect` lets the host intercept the click (e.g. to hide a dialog that would
 * otherwise stack above the wallet-connect modal); it falls back to connecting directly.
 */
const ConnectWalletHint = ({ testId, onConnect }: { testId?: string; onConnect?: () => void }) => {
  const connectWallet = useConnectWallet()

  return (
    <Alert variant="default" className="shrink-0 items-center rounded-md py-3">
      <Wallet className="!translate-y-0" />
      <AlertDescription className="flex w-full items-center gap-3 text-foreground">
        <span className="min-w-0 flex-1">Connect a wallet to discover accounts you own</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onConnect ?? connectWallet}
          data-testid={testId}
          className="shrink-0 hover:bg-muted"
        >
          Connect
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export default ConnectWalletHint
